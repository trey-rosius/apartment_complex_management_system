type CreateBookingInput = {
  input: {
    userId: string;
    apartmentId: string;
    startDate: string;
    endDate: string;
    bookingStatus: string;
  };
};

export default CreateBookingInput;
