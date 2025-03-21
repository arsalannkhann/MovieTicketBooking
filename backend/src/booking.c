#include "booking.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int book_seats(int movie_id, int showtime_id, const char *seats_json, char *result, size_t result_size) {
    struct json_object *seats_obj = json_tokener_parse(seats_json);
    if (!seats_obj) {
        snprintf(result, result_size, "{\"success\": false, \"error\": \"Invalid seats JSON\"}");
        return 1;
    }

    int seat_count = json_object_array_length(seats_obj);
    json_object_put(seats_obj); // Free memory

    // Simulate booking logic (in reality, you'd validate against a DB here)
    if (seat_count > 0) {
        snprintf(result, result_size, "{\"success\": true, \"movie_id\": %d, \"showtime_id\": %d, \"seats_booked\": %d}", 
                 movie_id, showtime_id, seat_count);
        return 0;
    } else {
        snprintf(result, result_size, "{\"success\": false, \"error\": \"No seats selected\"}");
        return 1;
    }
}

int main(int argc, char *argv[]) {
    if (argc != 4) {
        printf("{\"success\": false, \"error\": \"Usage: %s <movie_id> <showtime_id> <seats_json>\"}", argv[0]);
        return 1;
    }

    int movie_id = atoi(argv[1]);
    int showtime_id = atoi(argv[2]);
    const char *seats_json = argv[3];
    char result[256];

    book_seats(movie_id, showtime_id, seats_json, result, sizeof(result));
    printf("%s", result);
    return 0;
}