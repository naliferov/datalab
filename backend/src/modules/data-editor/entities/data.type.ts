interface BaseType {
  i?: {
    id: string;
    t: string;
    openable?: boolean;
  };
}

export interface BinaryType extends BaseType {
  b: string;
}

export interface EntityType extends BaseType {
  //also need to add serialization names and normal type names?
  v: null | boolean | number | string;
}

export interface MapType extends BaseType {
  m: Record<string, DataType | string>;
  o: string[];
}

export interface ListType extends BaseType {
  l: string[];
}

export type DataType = BinaryType | EntityType | MapType | ListType;
