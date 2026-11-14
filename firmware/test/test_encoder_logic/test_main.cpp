#include <stdint.h>

#include <unity.h>

#include "encoder_logic.h"

void setUp() {}
void tearDown() {}

void test_detent_emits_once_then_stays_idle() {
  int8_t accumulator = 0;

  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, 1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, 1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, 1));
  TEST_ASSERT_EQUAL_INT8(1, consumeEncoderQuarter(accumulator, 1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, 0));
}

void test_reverse_detent_emits_negative_once() {
  int8_t accumulator = 0;

  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, -1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, -1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, -1));
  TEST_ASSERT_EQUAL_INT8(-1, consumeEncoderQuarter(accumulator, -1));
  TEST_ASSERT_EQUAL_INT8(0, consumeEncoderQuarter(accumulator, 0));
}

int main(int argc, char** argv) {
  UNITY_BEGIN();
  RUN_TEST(test_detent_emits_once_then_stays_idle);
  RUN_TEST(test_reverse_detent_emits_negative_once);
  return UNITY_END();
}
