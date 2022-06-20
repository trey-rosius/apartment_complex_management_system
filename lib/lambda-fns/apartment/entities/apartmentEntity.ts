interface ApartmentParameters {
  id: string;
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
  createdOn: string;
}

export class ApartmentEntity {
  id: string;
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
  createdOn: string;
  constructor({
    id,
    apartmentNumber,
    buildingId,
    numberOfRooms,
    apartmentType,
    createdOn,
  }: ApartmentParameters) {
    this.id = id;
    this.apartmentNumber = apartmentNumber;
    this.buildingId = buildingId;
    this.numberOfRooms = numberOfRooms;
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
      createdOn: this.createdOn,
    };
  }
}
