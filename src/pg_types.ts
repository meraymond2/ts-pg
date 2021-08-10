import { log } from "./utils"

export type TSType = string | number | boolean | null | TSType[]

// For some types, it might be worth attempting to parse based on the typname,
// like Postgis `geometry`.
export const parseVal = (val: string | null, oid: number): TSType => {
  const parser = oidToParser[oid] || parseUnknown(oid)
  return val ? parser(val) : val
}

const parseBool = (s: string): boolean => s === "true"
const keepAsString = (s: string): string => s
const parseUnknown =
  (oid: number) =>
  (val: string | null): string => {
    log.info(`Unhandled type ${oid}`)
    return val
  }

// The oids for the built in types are stable enough, so they’re
// hard-coded.
const oidToParser: Record<number, (string) => TSType> = {
  16: parseBool, // bool
  17: keepAsString, // bytea
  18: keepAsString, // char
  19: keepAsString, // name
  20: parseInt, // int8
  21: parseInt, // int2
  22: parseUnknown(22), // int2vector
  23: parseInt, // int4
  24: keepAsString, // regproc (function name)
  25: keepAsString, // text
  26: parseInt, // oid
  27: parseInt, // tid
  28: parseInt, // xid
  29: parseInt, // cid
  30: parseUnknown(30), // oidvector
  32: parseUnknown(32), // pg_ddl_command
  71: parseUnknown(71), // pg_type
  75: parseUnknown(75), // pg_attribute
  81: parseUnknown(81), // pg_proc
  83: parseUnknown(83), // pg_class
  114: parseUnknown(114), // json
  142: parseUnknown(142), // xml
  143: parseUnknown(143), // _xml
  194: parseUnknown(194), // pg_node_tree
  199: parseUnknown(199), // _json
  269: parseUnknown(269), // table_am_handler
  271: parseUnknown(271), // _xid8
  325: parseUnknown(325), // index_am_handler
  600: parseUnknown(600), // point
  601: parseUnknown(601), // lseg
  602: parseUnknown(602), // path
  603: parseUnknown(603), // box
  604: parseUnknown(604), // polygon
  628: parseUnknown(628), // line
  629: parseUnknown(629), // _line
  650: parseUnknown(650), // cidr
  651: parseUnknown(651), // _cidr
  700: parseUnknown(700), // float4
  701: parseUnknown(701), // float8
  705: parseUnknown(705), // unknown
  718: parseUnknown(718), // circle
  719: parseUnknown(719), // _circle
  774: parseUnknown(774), // macaddr8
  775: parseUnknown(775), // _macaddr8
  790: parseUnknown(790), // money
  791: parseUnknown(791), // _money
  829: parseUnknown(829), // macaddr
  869: parseUnknown(869), // inet
  1000: parseUnknown(1000), // _bool
  1001: parseUnknown(1001), // _bytea
  1002: parseUnknown(1002), // _char
  1003: parseUnknown(1003), // _name
  1005: parseUnknown(1005), // _int2
  1006: parseUnknown(1006), // _int2vector
  1007: parseUnknown(1007), // _int4
  1008: parseUnknown(1008), // _regproc
  1009: parseUnknown(1009), // _text
  1010: parseUnknown(1010), // _tid
  1011: parseUnknown(1011), // _xid
  1012: parseUnknown(1012), // _cid
  1013: parseUnknown(1013), // _oidvector
  1014: parseUnknown(1014), // _bpchar
  1015: parseUnknown(1015), // _varchar
  1016: parseUnknown(1016), // _int8
  1017: parseUnknown(1017), // _point
  1018: parseUnknown(1018), // _lseg
  1019: parseUnknown(1019), // _path
  1020: parseUnknown(1020), // _box
  1021: parseUnknown(1021), // _float4
  1022: parseUnknown(1022), // _float8
  1027: parseUnknown(1027), // _polygon
  1028: parseUnknown(1028), // _oid
  1033: parseUnknown(1033), // aclitem
  1034: parseUnknown(1034), // _aclitem
  1040: parseUnknown(1040), // _macaddr
  1041: parseUnknown(1041), // _inet
  1042: parseUnknown(1042), // bpchar
  1043: keepAsString, // varchar
  1082: parseUnknown(1082), // date
  1083: parseUnknown(1083), // time
  1114: parseUnknown(1114), // timestamp
  1115: parseUnknown(1115), // _timestamp
  1182: parseUnknown(1182), // _date
  1183: parseUnknown(1183), // _time
  1184: parseUnknown(1184), // timestamptz
  1185: parseUnknown(1185), // _timestamptz
  1186: parseUnknown(1186), // interval
  1187: parseUnknown(1187), // _interval
  1231: parseUnknown(1231), // _numeric
  1248: parseUnknown(1248), // pg_database
  1263: parseUnknown(1263), // _cstring
  1266: parseUnknown(1266), // timetz
  1270: parseUnknown(1270), // _timetz
  1560: parseUnknown(1560), // bit
  1561: parseUnknown(1561), // _bit
  1562: parseUnknown(1562), // varbit
  1563: parseUnknown(1563), // _varbit
  1700: parseUnknown(1700), // numeric
  1790: parseUnknown(1790), // refcursor
  2201: parseUnknown(2201), // _refcursor
  2202: parseUnknown(2202), // regprocedure
  2203: parseUnknown(2203), // regoper
  2204: parseUnknown(2204), // regoperator
  2205: parseUnknown(2205), // regclass
  2206: parseUnknown(2206), // regtype
  2207: parseUnknown(2207), // _regprocedure
  2208: parseUnknown(2208), // _regoper
  2209: parseUnknown(2209), // _regoperator
  2210: parseUnknown(2210), // _regclass
  2211: parseUnknown(2211), // _regtype
  2249: parseUnknown(2249), // record
  2275: parseUnknown(2275), // cstring
  2276: parseUnknown(2276), // any
  2277: parseUnknown(2277), // anyarray
  2278: parseUnknown(2278), // void
  2279: parseUnknown(2279), // trigger
  2280: parseUnknown(2280), // language_handler
  2281: parseUnknown(2281), // internal
  2283: parseUnknown(2283), // anyelement
  2287: parseUnknown(2287), // _record
  2776: parseUnknown(2776), // anynonarray
  2842: parseUnknown(2842), // pg_authid
  2843: parseUnknown(2843), // pg_auth_members
  2949: parseUnknown(2949), // _txid_snapshot
  2950: parseUnknown(2950), // uuid
  2951: parseUnknown(2951), // _uuid
  3802: parseUnknown(3802), // jsonb
}
