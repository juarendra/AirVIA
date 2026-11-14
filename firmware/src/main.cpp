#include <Arduino.h>
#include <EEPROM.h>
#include <HID-Project.h>
#include <string.h>

#define Keyboard BootKeyboard
#define Mouse BootMouse

#include "board_pins.h"
#include "config_types.h"
#include "protocol.h"

using namespace OrthoPadConfig;
using namespace OrthoPadPins;
using namespace OrthoPadProtocol;

namespace {
constexpr uint8_t ButtonPins[ButtonCount + 2] = {
  Button1, Button2, Button3, Button4, Button5, JoySwitch, EncoderSwitch,
};
constexpr uint16_t DebounceMs = 8;
constexpr uint16_t MaxFrame = 2 + 7 + MaxPayload + 2;
constexpr uint16_t StorageMagic = 0x4f50;
constexpr uint16_t StorageSlotSize = 256;
constexpr uint8_t StorageHeaderSize = 12;
constexpr uint8_t ModifierCtrl = 0x01;
constexpr uint8_t ModifierShift = 0x02;
constexpr uint8_t ModifierAlt = 0x04;
constexpr uint8_t ModifierGui = 0x08;

DeviceConfig activeConfig;
DeviceConfig stagingConfig;
#if !defined(ORTHOPAD_DIAGNOSTIC)
bool stagingDirty = false;
#endif
uint32_t storageGeneration = 0;
uint8_t activeStorageSlot = 0;
uint8_t activeLayer = 0;

bool rawPressed[ButtonCount + 2] = {};
bool stablePressed[ButtonCount + 2] = {};
uint32_t changedAt[ButtonCount + 2] = {};
bool joyHeld = false;
bool orbitActive = false;
bool panActive = false;
uint32_t joyPressedAt = 0;
bool encoderHeld = false;
uint32_t encoderPressedAt = 0;
bool encoderLayerTriggered = false;
int8_t encoderQuarter = 0;
uint8_t previousEncoderState = 0;
uint32_t lastJoystickAt = 0;
uint32_t lastDiagnosticAt = 0;
#if !defined(ORTHOPAD_DIAGNOSTIC)

uint8_t rxBuffer[MaxFrame] = {};
uint16_t rxLength = 0;
uint16_t rxExpected = 0;
#endif

uint16_t readU16(const uint8_t* data) {
  return static_cast<uint16_t>(data[0]) | (static_cast<uint16_t>(data[1]) << 8);
}

void writeU16(uint8_t* data, uint16_t value) {
  data[0] = static_cast<uint8_t>(value & 0xff);
  data[1] = static_cast<uint8_t>(value >> 8);
}

#if !defined(ORTHOPAD_DIAGNOSTIC)
void writeU32(uint8_t* data, uint32_t value) {
  data[0] = static_cast<uint8_t>(value & 0xff);
  data[1] = static_cast<uint8_t>((value >> 8) & 0xff);
  data[2] = static_cast<uint8_t>((value >> 16) & 0xff);
  data[3] = static_cast<uint8_t>(value >> 24);
}
#endif

uint16_t configPayloadSize() {
  return LayerCount * ButtonCount * 4 + LayerCount * 2 * 4 + 23;
}

uint16_t serializeConfig(const DeviceConfig& config, uint8_t* output) {
  uint16_t offset = 0;
  auto writeAction = [&](const Action& action) {
    output[offset++] = action.type;
    const uint16_t value = action.type == ActionWheel ? static_cast<uint16_t>(action.amount) : action.keycode;
    writeU16(output + offset, value);
    offset += 2;
    output[offset++] = action.modifiers;
  };
  for (uint8_t layer = 0; layer < LayerCount; ++layer)
    for (uint8_t button = 0; button < ButtonCount; ++button) writeAction(config.keymap[layer][button]);
  for (uint8_t layer = 0; layer < LayerCount; ++layer)
    for (uint8_t direction = 0; direction < 2; ++direction) writeAction(config.encoders[layer][direction]);
  const CadSettings& s = config.settings;
  writeU16(output + offset, s.centerX); offset += 2;
  writeU16(output + offset, s.centerY); offset += 2;
  writeU16(output + offset, s.deadzone); offset += 2;
  writeU16(output + offset, s.speedMilli); offset += 2;
  writeU16(output + offset, s.curveMilli); offset += 2;
  output[offset++] = static_cast<uint8_t>((s.invertX ? 1 : 0) | (s.invertY ? 2 : 0));
  writeU16(output + offset, s.tapMs); offset += 2;
  writeU16(output + offset, s.holdMs); offset += 2;
  writeU16(output + offset, s.encoderTapMs); offset += 2;
  writeU16(output + offset, s.layerHoldMs); offset += 2;
  output[offset++] = s.encoderDirection < 0 ? 0xff : 1;
  output[offset++] = static_cast<uint8_t>(s.wheelStep);
  output[offset++] = s.panModifier;
  output[offset++] = 0;
  return offset;
}

bool deserializeConfig(DeviceConfig& config, const uint8_t* input, uint16_t length) {
  if (length != configPayloadSize()) return false;
  uint16_t offset = 0;
  auto readAction = [&](Action& action) {
    action.type = input[offset++];
    const uint16_t value = readU16(input + offset); offset += 2;
    action.modifiers = input[offset++];
    action.keycode = action.type == ActionWheel ? 0 : value;
    action.amount = action.type == ActionWheel ? static_cast<int16_t>(value) : 0;
  };
  for (uint8_t layer = 0; layer < LayerCount; ++layer)
    for (uint8_t button = 0; button < ButtonCount; ++button) readAction(config.keymap[layer][button]);
  for (uint8_t layer = 0; layer < LayerCount; ++layer)
    for (uint8_t direction = 0; direction < 2; ++direction) readAction(config.encoders[layer][direction]);
  CadSettings& s = config.settings;
  s.centerX = readU16(input + offset); offset += 2;
  s.centerY = readU16(input + offset); offset += 2;
  s.deadzone = readU16(input + offset); offset += 2;
  s.speedMilli = readU16(input + offset); offset += 2;
  s.curveMilli = readU16(input + offset); offset += 2;
  const uint8_t flags = input[offset++];
  s.invertX = (flags & 1) != 0;
  s.invertY = (flags & 2) != 0;
  s.tapMs = readU16(input + offset); offset += 2;
  s.holdMs = readU16(input + offset); offset += 2;
  s.encoderTapMs = readU16(input + offset); offset += 2;
  s.layerHoldMs = readU16(input + offset); offset += 2;
  s.encoderDirection = input[offset++] == 0xff ? -1 : 1;
  s.wheelStep = static_cast<int8_t>(input[offset++]);
  s.panModifier = input[offset++];
  ++offset;
  return true;
}

bool validAction(const Action& action) {
  return action.type <= ActionWheel &&
         action.modifiers <= 0x0f &&
         (action.type != ActionKey || action.keycode <= 0xff);
}

bool validConfig(const DeviceConfig& config) {
  for (uint8_t layer = 0; layer < LayerCount; ++layer) {
    for (uint8_t button = 0; button < ButtonCount; ++button)
      if (!validAction(config.keymap[layer][button])) return false;
    for (uint8_t direction = 0; direction < 2; ++direction)
      if (!validAction(config.encoders[layer][direction])) return false;
  }
  const CadSettings& s = config.settings;
  return s.centerX <= 1023 && s.centerY <= 1023 && s.deadzone <= 512 &&
         s.speedMilli > 0 && s.speedMilli <= 10000 && s.curveMilli >= 100 && s.curveMilli <= 5000 &&
         s.tapMs < s.holdMs && s.encoderTapMs < s.layerHoldMs &&
         (s.encoderDirection == -1 || s.encoderDirection == 1) && s.wheelStep >= 1 && s.wheelStep <= 10 && s.panModifier <= 0x0f;
}

int slotAddress(uint8_t slot) {
  return static_cast<int>(slot) * StorageSlotSize;
}

bool readStorageSlot(uint8_t slot, DeviceConfig& config, uint32_t& generation) {
  const int address = slotAddress(slot);
  const uint16_t magic = static_cast<uint16_t>(EEPROM.read(address)) | (static_cast<uint16_t>(EEPROM.read(address + 1)) << 8);
  if (magic != StorageMagic) return false;
  const uint16_t schema = static_cast<uint16_t>(EEPROM.read(address + 2)) | (static_cast<uint16_t>(EEPROM.read(address + 3)) << 8);
  if (schema != SchemaVersion) return false;
  generation = static_cast<uint32_t>(EEPROM.read(address + 4)) |
               (static_cast<uint32_t>(EEPROM.read(address + 5)) << 8) |
               (static_cast<uint32_t>(EEPROM.read(address + 6)) << 16) |
               (static_cast<uint32_t>(EEPROM.read(address + 7)) << 24);
  const uint16_t length = static_cast<uint16_t>(EEPROM.read(address + 8)) | (static_cast<uint16_t>(EEPROM.read(address + 9)) << 8);
  if (length != configPayloadSize() || length > StorageSlotSize - StorageHeaderSize) return false;
  uint8_t payload[128] = {};
  for (uint16_t i = 0; i < length; ++i) payload[i] = EEPROM.read(address + StorageHeaderSize + i);
  const uint16_t storedCrc = static_cast<uint16_t>(EEPROM.read(address + 10)) | (static_cast<uint16_t>(EEPROM.read(address + 11)) << 8);
  if (crc16(payload, length) != storedCrc) return false;
  return deserializeConfig(config, payload, length) && validConfig(config);
}

bool saveStorage(const DeviceConfig& config) {
  if (!validConfig(config)) return false;
  uint8_t payload[128] = {};
  const uint16_t length = serializeConfig(config, payload);
  if (length > StorageSlotSize - StorageHeaderSize) return false;
  const uint8_t slot = activeStorageSlot == 0 ? 1 : 0;
  const int address = slotAddress(slot);
  const uint32_t generation = storageGeneration + 1;
  EEPROM.update(address, static_cast<uint8_t>(StorageMagic & 0xff));
  EEPROM.update(address + 1, static_cast<uint8_t>(StorageMagic >> 8));
  EEPROM.update(address + 2, static_cast<uint8_t>(SchemaVersion & 0xff));
  EEPROM.update(address + 3, static_cast<uint8_t>(SchemaVersion >> 8));
  for (uint8_t i = 0; i < 4; ++i) EEPROM.update(address + 4 + i, static_cast<uint8_t>(generation >> (i * 8)));
  EEPROM.update(address + 8, static_cast<uint8_t>(length & 0xff));
  EEPROM.update(address + 9, static_cast<uint8_t>(length >> 8));
  const uint16_t checksum = crc16(payload, length);
  EEPROM.update(address + 10, static_cast<uint8_t>(checksum & 0xff));
  EEPROM.update(address + 11, static_cast<uint8_t>(checksum >> 8));
  for (uint16_t i = 0; i < length; ++i) EEPROM.update(address + StorageHeaderSize + i, payload[i]);
  DeviceConfig verify{};
  uint32_t verifyGeneration = 0;
  if (!readStorageSlot(slot, verify, verifyGeneration) || verifyGeneration != generation) return false;
  activeStorageSlot = slot;
  storageGeneration = generation;
  return true;
}

void loadConfig() {
  DeviceConfig first{};
  DeviceConfig second{};
  uint32_t firstGeneration = 0;
  uint32_t secondGeneration = 0;
  const bool firstValid = readStorageSlot(0, first, firstGeneration);
  const bool secondValid = readStorageSlot(1, second, secondGeneration);
  if (secondValid && (!firstValid || secondGeneration >= firstGeneration)) {
    activeConfig = second;
    activeStorageSlot = 1;
    storageGeneration = secondGeneration;
  } else if (firstValid) {
    activeConfig = first;
    activeStorageSlot = 0;
    storageGeneration = firstGeneration;
  } else {
    activeConfig = defaults();
    saveStorage(activeConfig);
  }
  stagingConfig = activeConfig;
}

void releaseAllHid() {
  Keyboard.releaseAll();
  Mouse.release(MOUSE_LEFT);
  Mouse.release(MOUSE_MIDDLE);
  Mouse.release(MOUSE_RIGHT);
  joyHeld = false;
  orbitActive = false;
  panActive = false;
}

void pressModifier(uint8_t modifiers) {
  if (modifiers & ModifierCtrl) Keyboard.press(KEY_LEFT_CTRL);
  if (modifiers & ModifierShift) Keyboard.press(KEY_LEFT_SHIFT);
  if (modifiers & ModifierAlt) Keyboard.press(KEY_LEFT_ALT);
  if (modifiers & ModifierGui) Keyboard.press(KEY_LEFT_GUI);
}

void releaseModifier(uint8_t modifiers) {
  if (modifiers & ModifierCtrl) Keyboard.release(KEY_LEFT_CTRL);
  if (modifiers & ModifierShift) Keyboard.release(KEY_LEFT_SHIFT);
  if (modifiers & ModifierAlt) Keyboard.release(KEY_LEFT_ALT);
  if (modifiers & ModifierGui) Keyboard.release(KEY_LEFT_GUI);
}

void tapAction(const Action& action) {
  if (action.type == ActionNone) return;
  if (action.type == ActionWheel) {
    int16_t amount = action.amount * activeConfig.settings.wheelStep;
    if (amount > 127) amount = 127;
    if (amount < -127) amount = -127;
    Mouse.move(0, 0, static_cast<int8_t>(amount));
    return;
  }
  pressModifier(action.modifiers);
  const KeyboardKeycode keycode = static_cast<KeyboardKeycode>(action.keycode & 0xff);
  Keyboard.press(keycode);
  Keyboard.release(keycode);
  releaseModifier(action.modifiers);
}

void processButton(uint8_t index, bool pressed, uint32_t now) {
  if (index < ButtonCount && pressed) {
    tapAction(activeConfig.keymap[activeLayer][index]);
    return;
  }
  if (index == ButtonCount) {
    if (pressed) {
      joyPressedAt = now;
      joyHeld = true;
    } else {
      if (orbitActive || panActive) releaseAllHid();
      else if (now - joyPressedAt < activeConfig.settings.tapMs) Mouse.click(MOUSE_LEFT);
      joyHeld = false;
    }
  }
  if (index == ButtonCount + 1) {
    if (pressed) {
      encoderPressedAt = now;
      encoderHeld = true;
      encoderLayerTriggered = false;
    } else {
      if (!encoderLayerTriggered && now - encoderPressedAt < activeConfig.settings.encoderTapMs) Mouse.click(MOUSE_RIGHT);
      encoderHeld = false;
      encoderLayerTriggered = false;
    }
  }
}

void scanButtons(uint32_t now) {
#if defined(ORTHOPAD_DIAGNOSTIC)
  (void)now;
  return;
#endif
  for (uint8_t i = 0; i < ButtonCount + 2; ++i) {
    const bool pressed = digitalRead(ButtonPins[i]) == LOW;
    if (pressed != rawPressed[i]) {
      rawPressed[i] = pressed;
      changedAt[i] = now;
    }
    if (stablePressed[i] != rawPressed[i] && now - changedAt[i] >= DebounceMs) {
      stablePressed[i] = rawPressed[i];
      processButton(i, stablePressed[i], now);
    }
  }

  if (joyHeld && !orbitActive && now - joyPressedAt >= activeConfig.settings.holdMs) {
    const bool pan = encoderHeld;
    if (pan) {
      pressModifier(activeConfig.settings.panModifier);
      Mouse.press(MOUSE_MIDDLE);
      panActive = true;
    } else {
      Mouse.press(MOUSE_MIDDLE);
      orbitActive = true;
    }
  }
  if (encoderHeld && !encoderLayerTriggered && !joyHeld && now - encoderPressedAt >= activeConfig.settings.layerHoldMs) {
    activeLayer = static_cast<uint8_t>((activeLayer + 1) % LayerCount);
    encoderLayerTriggered = true;
    digitalWrite(LED_BUILTIN, HIGH);
  }
}

void processEncoder(uint32_t now) {
  (void)now;
#if defined(ORTHOPAD_DIAGNOSTIC)
  return;
#endif
  const uint8_t current = static_cast<uint8_t>((digitalRead(EncoderA) << 1) | digitalRead(EncoderB));
  const uint8_t transition = static_cast<uint8_t>((previousEncoderState << 2) | current);
  previousEncoderState = current;
  static const int8_t table[16] = {0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0};
  encoderQuarter += table[transition];
  if (encoderQuarter >= 4 || encoderQuarter <= -4) {
    const int8_t direction = encoderQuarter > 0 ? 1 : -1;
    encoderQuarter = 0;
    const Action& action = direction * activeConfig.settings.encoderDirection > 0
      ? activeConfig.encoders[activeLayer][0]
      : activeConfig.encoders[activeLayer][1];
    tapAction(action);
  }
}

int8_t axisDelta(uint16_t value, uint16_t center, bool invert) {
  const int16_t delta = static_cast<int16_t>(value) - static_cast<int16_t>(center);
  const int16_t magnitude = abs(delta);
  const int16_t deadzone = static_cast<int16_t>(activeConfig.settings.deadzone);
  if (magnitude <= deadzone) return 0;
  int16_t usable = static_cast<int16_t>(512 - deadzone);
  if (usable < 1) usable = 1;

  const int32_t outside = magnitude - deadzone;
  const int32_t normalized = outside * 1000L / usable > 1000 ? 1000 : outside * 1000L / usable;
  const int32_t square = normalized * normalized / 1000;
  const int32_t curve = activeConfig.settings.curveMilli;
  int32_t shaped = normalized;
  if (curve < 1000) shaped = normalized + (square - normalized) * (1000 - curve) / 900;
  else if (curve > 1000) shaped = normalized + (normalized - square) * (curve - 1000) / 4000;
  int32_t result = (delta > 0 ? shaped : -shaped) * activeConfig.settings.speedMilli / 1000;
  if (result > 127) result = 127;
  if (result < -127) result = -127;
  if (result == 0) result = delta > 0 ? 1 : -1;
  return invert ? static_cast<int8_t>(-result) : static_cast<int8_t>(result);
}

void processJoystick(uint32_t now) {
#if defined(ORTHOPAD_DIAGNOSTIC)
  (void)now;
  return;
#endif
  if (now - lastJoystickAt < 5000) return;
  lastJoystickAt = now;
  const uint16_t x = analogRead(JoyX);
  const uint16_t y = analogRead(JoyY);
  const int8_t dx = axisDelta(x, activeConfig.settings.centerX, activeConfig.settings.invertX);
  const int8_t dy = axisDelta(y, activeConfig.settings.centerY, activeConfig.settings.invertY);
  if (dx != 0 || dy != 0) Mouse.move(dx, dy, 0);
}

#if !defined(ORTHOPAD_DIAGNOSTIC)
void appendAction(uint8_t* output, uint16_t& offset, const Action& action) {
  output[offset++] = action.type;
  const uint16_t value = action.type == ActionWheel ? static_cast<uint16_t>(action.amount) : action.keycode;
  writeU16(output + offset, value); offset += 2;
  output[offset++] = action.modifiers;
}

bool parseAction(const uint8_t* input, uint16_t& offset, uint16_t length, Action& action) {
  if (offset + 4 > length) return false;
  action.type = input[offset++];
  const uint16_t value = readU16(input + offset); offset += 2;
  action.modifiers = input[offset++];
  action.keycode = action.type == ActionWheel ? 0 : value;
  action.amount = action.type == ActionWheel ? static_cast<int16_t>(value) : 0;
  return validAction(action);
}

uint16_t makeInfo(uint8_t* output) {
  const char* name = "OrthoPad";
  const char* firmware = "0.1.0";
  uint16_t offset = 0;
  output[offset++] = strlen(name);
  memcpy(output + offset, name, strlen(name)); offset += strlen(name);
  output[offset++] = strlen(firmware);
  memcpy(output + offset, firmware, strlen(firmware)); offset += strlen(firmware);
  output[offset++] = 1;
  output[offset++] = 0;
  writeU16(output + offset, SchemaVersion); offset += 2;
  output[offset++] = LayerCount;
  output[offset++] = ButtonCount;
  output[offset++] = EncoderCount;
  writeU32(output + offset, 0x1f); offset += 4;
  return offset;
}

uint16_t makeSettings(uint8_t* output) {
  uint16_t offset = 0;
  const CadSettings& s = stagingConfig.settings;
  writeU16(output + offset, s.centerX); offset += 2;
  writeU16(output + offset, s.centerY); offset += 2;
  writeU16(output + offset, s.deadzone); offset += 2;
  writeU16(output + offset, s.speedMilli); offset += 2;
  writeU16(output + offset, s.curveMilli); offset += 2;
  output[offset++] = static_cast<uint8_t>((s.invertX ? 1 : 0) | (s.invertY ? 2 : 0));
  writeU16(output + offset, s.tapMs); offset += 2;
  writeU16(output + offset, s.holdMs); offset += 2;
  writeU16(output + offset, s.encoderTapMs); offset += 2;
  writeU16(output + offset, s.layerHoldMs); offset += 2;
  output[offset++] = s.encoderDirection < 0 ? 0xff : 1;
  output[offset++] = static_cast<uint8_t>(s.wheelStep);
  output[offset++] = s.panModifier;
  output[offset++] = 0;
  return offset;
}

bool parseSettings(const uint8_t* input, uint16_t length) {
  if (length != 23) return false;
  uint16_t offset = 0;
  CadSettings& s = stagingConfig.settings;
  s.centerX = readU16(input + offset); offset += 2;
  s.centerY = readU16(input + offset); offset += 2;
  s.deadzone = readU16(input + offset); offset += 2;
  s.speedMilli = readU16(input + offset); offset += 2;
  s.curveMilli = readU16(input + offset); offset += 2;
  const uint8_t flags = input[offset++];
  s.invertX = (flags & 1) != 0;
  s.invertY = (flags & 2) != 0;
  s.tapMs = readU16(input + offset); offset += 2;
  s.holdMs = readU16(input + offset); offset += 2;
  s.encoderTapMs = readU16(input + offset); offset += 2;
  s.layerHoldMs = readU16(input + offset); offset += 2;
  s.encoderDirection = input[offset++] == 0xff ? -1 : 1;
  s.wheelStep = static_cast<int8_t>(input[offset++]);
  s.panModifier = input[offset++];
  ++offset;
  return validConfig(stagingConfig);
}
#endif

#if !defined(ORTHOPAD_DIAGNOSTIC)
void sendResponse(uint16_t sequence, uint8_t command, Status status, const uint8_t* data = nullptr, uint16_t dataLength = 0) {
  if (dataLength > MaxPayload - 1) dataLength = MaxPayload - 1;
  uint8_t body[7 + MaxPayload] = {};
  body[0] = Version;
  body[1] = Response | (status == Ok ? 0 : Error);
  writeU16(body + 2, sequence);
  body[4] = command;
  writeU16(body + 5, dataLength + 1);
  body[7] = status;
  if (data && dataLength > 0) memcpy(body + 8, data, dataLength);
  const uint16_t bodyLength = 8 + dataLength;
  const uint16_t checksum = crc16(body, bodyLength);
  Serial.write(Sync0);
  Serial.write(Sync1);
  Serial.write(body, bodyLength);
  Serial.write(static_cast<uint8_t>(checksum & 0xff));
  Serial.write(static_cast<uint8_t>(checksum >> 8));
}

void handleCommand(uint8_t version, uint16_t sequence, uint8_t command, const uint8_t* payload, uint16_t length) {
  if (version != Version) { sendResponse(sequence, command, UnsupportedVersion); return; }
  uint8_t output[MaxPayload] = {};
  uint16_t outputLength = 0;
  switch (command) {
    case Hello:
      if (length != 2) { sendResponse(sequence, command, InvalidLength); return; }
      outputLength = makeInfo(output);
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case GetInfo:
      if (length != 0) { sendResponse(sequence, command, InvalidLength); return; }
      outputLength = makeInfo(output);
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case GetKeymap:
      if (length != 1 || payload[0] >= LayerCount) { sendResponse(sequence, command, InvalidArgument); return; }
      output[0] = ButtonCount;
      outputLength = 1;
      for (uint8_t i = 0; i < ButtonCount; ++i) appendAction(output, outputLength, stagingConfig.keymap[payload[0]][i]);
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case SetKeymap:
      if (length != 1 + 1 + ButtonCount * 4 || payload[0] >= LayerCount || payload[1] != ButtonCount) { sendResponse(sequence, command, InvalidLength); return; }
      {
        uint16_t offset = 2;
        for (uint8_t i = 0; i < ButtonCount; ++i) {
          if (!parseAction(payload, offset, length, stagingConfig.keymap[payload[0]][i]) || stagingConfig.keymap[payload[0]][i].type == ActionWheel) {
            sendResponse(sequence, command, InvalidArgument);
            return;
          }
        }
      }
      if (!validConfig(stagingConfig)) { sendResponse(sequence, command, InvalidArgument); return; }
      stagingDirty = true;
      sendResponse(sequence, command, Ok);
      return;
    case GetEncoder:
      if (length != 1 || payload[0] >= LayerCount) { sendResponse(sequence, command, InvalidArgument); return; }
      appendAction(output, outputLength = 0, stagingConfig.encoders[payload[0]][0]);
      appendAction(output, outputLength, stagingConfig.encoders[payload[0]][1]);
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case SetEncoder:
      if (length != 1 + 8 || payload[0] >= LayerCount) { sendResponse(sequence, command, InvalidLength); return; }
      {
        uint16_t offset = 1;
        if (!parseAction(payload, offset, length, stagingConfig.encoders[payload[0]][0]) || !parseAction(payload, offset, length, stagingConfig.encoders[payload[0]][1])) { sendResponse(sequence, command, InvalidArgument); return; }
      }
      stagingDirty = true;
      sendResponse(sequence, command, Ok);
      return;
    case GetCadSettings:
      if (length != 0) { sendResponse(sequence, command, InvalidLength); return; }
      outputLength = makeSettings(output);
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case SetCadSettings:
      if (!parseSettings(payload, length)) { sendResponse(sequence, command, InvalidArgument); return; }
      stagingDirty = true;
      sendResponse(sequence, command, Ok);
      return;
    case Commit:
      if (length != 0) { sendResponse(sequence, command, InvalidLength); return; }
      if (!saveStorage(stagingConfig)) { sendResponse(sequence, command, StorageError); return; }
      activeConfig = stagingConfig;
      stagingDirty = false;
      sendResponse(sequence, command, Ok);
      return;
    case Discard:
      if (length != 0) { sendResponse(sequence, command, InvalidLength); return; }
      stagingConfig = activeConfig;
      stagingDirty = false;
      sendResponse(sequence, command, Ok);
      return;
    case ResetDefaults:
      if (length != 2 || payload[0] != Sync0 || payload[1] != Sync1) { sendResponse(sequence, command, InvalidArgument); return; }
      stagingConfig = defaults();
      if (!saveStorage(stagingConfig)) { sendResponse(sequence, command, StorageError); return; }
      activeConfig = stagingConfig;
      stagingDirty = false;
      sendResponse(sequence, command, Ok);
      return;
    case Verify:
      if (length != 0) { sendResponse(sequence, command, InvalidLength); return; }
      writeU32(output, storageGeneration);
      outputLength = 4;
      sendResponse(sequence, command, Ok, output, outputLength);
      return;
    case Reboot:
      sendResponse(sequence, command, Ok);
      delay(10);
      asm volatile ("jmp 0");
      return;
    default:
      sendResponse(sequence, command, UnknownCommand);
      return;
  }
}
#endif

void consumeSerial() {
#if defined(ORTHOPAD_DIAGNOSTIC)
  return;
#else
  while (Serial.available() > 0) {
    const uint8_t byte = static_cast<uint8_t>(Serial.read());
    if (rxLength == 0) {
      if (byte != Sync0) continue;
      rxBuffer[rxLength++] = byte;
      continue;
    }
    if (rxLength == 1) {
      if (byte != Sync1) { rxLength = 0; continue; }
      rxBuffer[rxLength++] = byte;
      continue;
    }
    if (rxLength >= MaxFrame) { rxLength = 0; rxExpected = 0; continue; }
    rxBuffer[rxLength++] = byte;
    if (rxLength == 9) {
      const uint16_t payloadLength = readU16(rxBuffer + 7);
      if (payloadLength > MaxPayload) { rxLength = 0; rxExpected = 0; continue; }
      rxExpected = static_cast<uint16_t>(2 + 7 + payloadLength + 2);
    }
    if (rxExpected > 0 && rxLength >= rxExpected) {
      const uint8_t version = rxBuffer[2];
      const uint8_t flags = rxBuffer[3];
      const uint16_t sequence = readU16(rxBuffer + 4);
      const uint8_t command = rxBuffer[6];
      const uint16_t payloadLength = readU16(rxBuffer + 7);
      const uint16_t receivedCrc = readU16(rxBuffer + rxExpected - 2);
      const uint16_t calculatedCrc = crc16(rxBuffer + 2, static_cast<uint16_t>(7 + payloadLength));
      if (flags != 0 || receivedCrc != calculatedCrc) sendResponse(sequence, command, CrcError);
      else handleCommand(version, sequence, command, rxBuffer + 9, payloadLength);
      rxLength = 0;
      rxExpected = 0;
    }
  }
#endif
}

void diagnosticOutput(uint32_t now) {
#if defined(ORTHOPAD_DIAGNOSTIC)
  if (now - lastDiagnosticAt < 100) return;
  lastDiagnosticAt = now;
  Serial.print("JOY_X="); Serial.print(analogRead(JoyX));
  Serial.print(" JOY_Y="); Serial.print(analogRead(JoyY));
  Serial.print(" JOY_SW="); Serial.print(digitalRead(JoySwitch));
  Serial.print(" ENC_A="); Serial.print(digitalRead(EncoderA));
  Serial.print(" ENC_B="); Serial.print(digitalRead(EncoderB));
  Serial.print(" ENC_SW="); Serial.print(digitalRead(EncoderSwitch));
  Serial.print(" BTN=");
  for (uint8_t i = 0; i < ButtonCount; ++i) Serial.print(digitalRead(ButtonPins[i]));
  Serial.println();
#else
  (void)now;
#endif
}
}

void setup() {
  pinMode(JoySwitch, INPUT_PULLUP);
  pinMode(EncoderA, INPUT_PULLUP);
  pinMode(EncoderB, INPUT_PULLUP);
  pinMode(EncoderSwitch, INPUT_PULLUP);
  for (uint8_t i = 0; i < ButtonCount; ++i) pinMode(ButtonPins[i], INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.begin(115200);
  Keyboard.begin();
  Mouse.begin();
  loadConfig();
  previousEncoderState = static_cast<uint8_t>((digitalRead(EncoderA) << 1) | digitalRead(EncoderB));
  delay(250);
  releaseAllHid();
}

void loop() {
  const uint32_t now = millis();
  scanButtons(now);
  processEncoder(now);
  processJoystick(now);
  consumeSerial();
  diagnosticOutput(now);
  if (digitalRead(LED_BUILTIN) == HIGH && now - lastDiagnosticAt > 50) digitalWrite(LED_BUILTIN, LOW);
}
