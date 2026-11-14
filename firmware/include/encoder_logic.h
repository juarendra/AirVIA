#pragma once

#include <stdint.h>

inline int8_t consumeEncoderQuarter(int8_t& accumulator, int8_t delta) {
  accumulator += delta;
  if (accumulator < 4 && accumulator > -4) return 0;

  const int8_t direction = accumulator > 0 ? 1 : -1;
  accumulator = 0;
  return direction;
}
