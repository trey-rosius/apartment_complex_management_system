### Testing `createApartmentBooking` Endpoint

Sign in to your appsync account on the aws console, navigate to your project and run the following mutation.

```graphql
mutation create {
createApartmentBooking(input: {apartmentId: "2F6hDMkdfeX4wQau7Bhoi7cOuAH",
 bookingStatus: PENDING, endDate: "2022-10-22", startDate: "2022-09-22", 
userId: "[test1@gmail.com](mailto:test1@gmail.com)"})
}
```

Change the values of the `apartmentId` and `userId` to match those in your dynamoDB table.

If the mutation runs successfully, a `true` is returned.


![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/testing_create_apartment.png)

If we go to `processSqsBooking` lambda and look at its logs, we see that it has received a message. 

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/testing_create_apartment_2.png)

Then, the lambda would save this message into dynamoDB.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/testing_create_apartment_3.png)

If you attempt to run the mutation again with same values for `userId` and `apartmentId`, meaning that the same user wants to book the same apartment, with a previous `PENDING` booking status already in the system, the mutation fails.

`You already have a pending booking for this apartment`

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/testing_create_apartment_4.png)

Please create multiple users and create bookings with each of those users. We’ll be needing them in the next step.

After creating multiple bookings for an apartment, we want to give the building owner(Admin), a way to retrieve all bookings for each of their apartments, in-order to `APPROVE` or `DENY` a booking.
