#pragma once

#include <Arduino.h>

namespace OrthoPadProtocol {
constexpr uint8_t Sync0 = 0x4f;
constexpr uint8_t Sync1 = 0x50;
constexpr uint8_t Version = 1;
constexpr uint8_t Response = 0x01;
constexpr uint8_t Error = 0x02;
constexpr uint16_t MaxPayload = 128;

enum Command : uint8_t {
  Hello = 0x01,
  GetInfo = 0x02,
  GetKeymap = 0x10,
  SetKeymap = 0x11,
  GetEncoder = 0x12,
  SetEncoder = 0x13,
  GetCadSettings = 0x20,
  SetCadSettings = 0x21,
  Commit = 0x30,
  Discard = 0x31,
  ResetDefaults = 0x32,
  Verify = 0x33,
  GetJoystickState = 0x40,
  Reboot = 0x7f,
};

enum Status : uint8_t {
  Ok = 0x00,
  UnknownCommand = 0x01,
  InvalidLength = 0x02,
  InvalidArgument = 0x03,
  CrcError = 0x04,
  UnsupportedVersion = 0x05,
  Busy = 0x06,
  StorageError = 0x07,
  NotFound = 0x08,
  InternalError = 0x09,
};

inline uint16_t crc16(const uint8_t* data, uint16_t length) {
  uint16_t crc = 0xffff;
  for (uint16_t i = 0; i < length; ++i) {
    crc ^= static_cast<uint16_t>(data[i]) << 8;
    for (uint8_t bit = 0; bit < 8; ++bit) {
      crc = (crc & 0x8000) ? static_cast<uint16_t>((crc << 1) ^ 0x1021) : static_cast<uint16_t>(crc << 1);
    }
  }
  return crc;
}
}
