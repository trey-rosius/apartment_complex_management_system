interface ApartmentParameters {
  id: string;
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
  apartmentStatus: string;
  createdOn: string;
}

export class ApartmentEntity {
  id: string;
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
  apartmentStatus: string;
  createdOn: string;
  constructor({
    id,
    apartmentNumber,
    buildingId,
    numberOfRooms,
    apartmentType,
    apartmentStatus,
    createdOn,
  }: ApartmentParameters) {
    this.id = id;
    this.apartmentNumber = apartmentNumber;
    this.buildingId = buildingId;
    this.numberOfRooms = numberOfRooms;
    this.apartmentStatus = apartmentStatus;
    this.apartmentType = apartmentType;
    this.createdOn = createdOn;
  }

  key() {
    return {
      PK: `BUILDING#${this.buildingId}`,
      SK: `APARTMENT#${this.id}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      ENTITY: "APARTMENT",
      id: this.id,
      apartmentNumber: this.apartmentNumber,
      buildingId: this.buildingId,
      numberOfRooms: this.numberOfRooms,
      apartmentStatus: this.apartmentStatus,
      apartmentType: this.apartmentType,
      createdOn: this.createdOn,
    };
  }
  graphQLReturn() {
    return {
      id: this.id,
      apartmentNumber: this.apartmentNumber,
      buildingId: this.buildingId,
      numberOfRooms: this.numberOfRooms,
      apartmentType: this.apartmentType,
      apartmentStatus: this.apartmentStatus,
      createdOn: this.createdOn,
    };
  }
}
