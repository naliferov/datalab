interface MetaType {
  i?: {
    id: string;
    t: string;
    openable?: boolean;
  };
}

export interface BinaryType extends MetaType {
  b: string;
}

export interface PlainType extends MetaType {
  //todo rename to ScalarType?
  //also need to add serialization names and normal type names?
  v: null | boolean | number | string;
}

export interface MapType extends MetaType {
  m: Record<string, DataType | string>;
  o: string[];
}

export interface ListType extends MetaType {
  l: string[];
}

export type DataType = BinaryType | PlainType | MapType | ListType;
