interface IBookingParameters {
  id: string;
  userId: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  bookingStatus: string;
  createdOn: string;
}

export class BookingEntity {
  id: string;
  userId: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  bookingStatus: string;
  createdOn: string;

  constructor({
    id,
    userId,
    startDate,
    apartmentId,
    endDate,
    bookingStatus,
    createdOn,
  }: IBookingParameters) {
    this.id = id;
    this.userId = userId;
    this.apartmentId = apartmentId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.bookingStatus = bookingStatus;
    this.createdOn = createdOn;
  }

  key() {
    return {
      PK: `USER#${this.userId}`,
      SK: `APARTMENT#${this.apartmentId}`,
    };
  }
  gsi1Key() {
    return {
      GSI1PK: `APARTMENT#${this.apartmentId}`,
      GSI1SK: `BOOKING#${this.id}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      ...this.gsi1Key(),
      ENTITY: "BOOKING",
      id: this.id,
      userId: this.userId,
      apartmentId: this.apartmentId,
      startDate: this.startDate,
      endDate: this.endDate,
      bookingStatus: this.bookingStatus,
      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      userId: this.userId,
      apartmentId: this.apartmentId,
      startDate: this.startDate,
      endDate: this.endDate,
      bookingStatus: this.bookingStatus,
      createdOn: this.createdOn,
    };
  }
}
