## Testing `getAllBookingsPerApartment` endpoint.

Open up your appsync app in the aws console and run the query `getAllBookingsPerApartment`.Make sure you use an `apartmentId` for an apartment that has multiple booking.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/get_all_bookings_per_apartment.png)


```tsx
{
  "data": {
    "getAllBookingsPerApartment": [
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGKty2bIUaLr0C4Hc513rkX5oT",
        "startDate": "2022-09-22",
        "userId": "treyrosius@gmail.com",
        "user": {
          "email": "treyrosius@gmail.com",
          "firstName": "Rosius",
          "id": "2FGJzw5eiS5pWDUwH9r1PkjROYV",
          "lastName": "Ndimofor Ateh",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVn4SwbXF8LUsID3tY9lWTziO",
        "startDate": "2022-09-22",
        "userId": "test@gmail.com",
        "user": {
          "email": "test@gmail.com",
          "firstName": "Steve",
          "id": "2FGK3F4WKV28Y9edwsgUjn9gIuG",
          "lastName": "Rosius",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVr0WV3cqyIJSqOQc7kN4HwFg",
        "startDate": "2022-09-22",
        "userId": "tony@gmail.com",
        "user": {
          "email": "tony@gmail.com",
          "firstName": "Stark",
          "id": "2FGK8BOvlQMDWcQarYtTR2RAQ7a",
          "lastName": "Tony",
          "userType": "TENANT",
          "verified": true
        }
      }
    ]
  }
}
```

Notice that each booking as a user object. We don’t have to make an api request to get the `user` object separately.
