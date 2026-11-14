#pragma once

#include <Arduino.h>

namespace OrthoPadConfig {
constexpr uint8_t LayerCount = 3;
constexpr uint8_t ButtonCount = 5;
constexpr uint8_t EncoderCount = 1;
constexpr uint16_t SchemaVersion = 1;

enum ActionType : uint8_t {
  ActionNone = 0,
  ActionKey = 1,
  ActionWheel = 2,
};

struct Action {
  uint8_t type;
  uint16_t keycode;
  uint8_t modifiers;
  int16_t amount;
};

struct CadSettings {
  uint16_t centerX;
  uint16_t centerY;
  uint16_t deadzone;
  uint16_t speedMilli;
  uint16_t curveMilli;
  bool invertX;
  bool invertY;
  uint16_t tapMs;
  uint16_t holdMs;
  uint16_t encoderTapMs;
  uint16_t layerHoldMs;
  int8_t encoderDirection;
  int8_t wheelStep;
  uint8_t panModifier;
};

struct DeviceConfig {
  Action keymap[LayerCount][ButtonCount];
  Action encoders[LayerCount][2];
  CadSettings settings;
};

inline Action noneAction() {
  return {ActionNone, 0, 0, 0};
}

inline Action keyAction(uint16_t keycode, uint8_t modifiers = 0) {
  return {ActionKey, keycode, modifiers, 0};
}

inline Action wheelAction(int8_t amount) {
  return {ActionWheel, 0, 0, amount};
}

inline DeviceConfig defaults() {
  DeviceConfig config{};
  const uint16_t core[ButtonCount] = {0x29, 0x16, 0x10, 0x08, 0x14};
  const uint16_t sketch[ButtonCount] = {0x29, 0x0f, 0x06, 0x15, 0x07};
  const uint16_t modify[ButtonCount] = {0x29, 0x09, 0x0b, 0x12, 0x13};
  const uint16_t* keys[LayerCount] = {core, sketch, modify};
  for (uint8_t layer = 0; layer < LayerCount; ++layer) {
    for (uint8_t button = 0; button < ButtonCount; ++button) {
      config.keymap[layer][button] = keyAction(keys[layer][button]);
    }
    config.encoders[layer][0] = wheelAction(1);
    config.encoders[layer][1] = wheelAction(-1);
  }
  config.settings = {
    512, 512, 100, 1000, 1000, false, true,
    350, 700, 450, 700, 1, 1, 0x02,
  };
  return config;
}
}
