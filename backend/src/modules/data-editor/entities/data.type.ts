interface BaseType {
  meta?: {
    id: string;
    type: string;
    openable?: boolean;
  };
}

export interface BinaryType extends BaseType {
  binary: string;
}

export interface PrimitiveType extends BaseType {
  value: null | boolean | number | string;
  isBinary?: boolean;
}

export interface MapType extends BaseType {
  map: Record<string, DataType | string>;
  order: string[];
}

export interface ListType extends BaseType {
  list: (string | DataType)[];
}

export type DataType = BinaryType | PrimitiveType | MapType | ListType;
