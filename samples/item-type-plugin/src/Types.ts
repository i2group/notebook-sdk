import * as sdk from '@i2analyze/notebook-sdk';

export interface IProperty {
  type: sdk.data.LogicalType;
  name: string;
  value: string;
}

interface IItemBase {
  typeId: string;
  name: string;
  properties: IProperty[];
}

export interface IEntity extends IItemBase {
  shipmentId: string;
  icon: string;
}

export interface ILink extends IItemBase {
  fromId: string;
  toId: string;
}

export interface IExampleData {
  data: (IEntity | ILink)[];
}
