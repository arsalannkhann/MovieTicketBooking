#ifndef BOOKING_H
#define BOOKING_H

#include </opt/homebrew/opt/json-c/include/json-c/json.h>

int book_seats(int movie_id, int showtime_id, const char *seats_json, char *result, size_t result_size);

#endif