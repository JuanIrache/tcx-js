export declare class Timestamp {
    time_str: string;
    date: Date;
    epochMilliseconds: number;
    constructor(time_str: string);
    isValid(): boolean;
    toString(): string;
}
export declare class ElapsedTime {
    static readonly MILLISECONDS_PER_SECOND: number;
    static readonly SECONDS_PER_HOUR: number;
    static readonly SECONDS_PER_MINUTE: number;
    elapsedMs: number;
    secs: number;
    hh: number;
    mm: number;
    ss: number;
    constructor(elapsedMs: number);
    asHHMMSS(): string;
    private zeroPad;
}
export declare class GeoJsonLocation {
    type: string;
    coordinates: number[];
    constructor(latitude: number, longitude: number);
}
export declare class Trackpoint {
    static readonly DEFAULT_EPOCH_TIMESTAMP_STRING: string;
    static readonly MILES_PER_KILOMETER: number;
    static readonly YARDS_PER_MILE: number;
    static readonly FEET_PER_METER: number;
    doctype: string;
    time: string | null;
    seq: number | null;
    latitude: number | null;
    longitude: number | null;
    altitude_meters: number | null;
    altitude_feet: number | null;
    distance_meters: number | null;
    distance_miles: number | null;
    distance_km: number | null;
    distance_yds: number | null;
    heart_rate_bpm: number | null;
    speed: number | null;
    cadence: number | null;
    watts: number | null;
    location: GeoJsonLocation | null;
    elapsed_sec: number | null;
    elapsed_hhmmss: string | null;
    epoch_ms: number;
    constructor(raw_obj: JsonObject, sequence: number);
    addAltitudeFeet(): void;
    addDistances(): void;
    calculateElapsed(startingEpoch: number): void;
    addGeoJson(): void;
    cleanup(): void;
}
export declare class Author {
    type: string;
    name: string;
    part_number: string;
    lang: string;
    build_major: string;
    build_minor: string;
    version_major: string;
    version_minor: string;
    constructor(raw_obj: JsonObject | null);
}
export declare class Creator {
    type: string;
    name: string;
    product_id: string;
    unit_id: string;
    build_major: string;
    build_minor: string;
    version_major: string;
    version_minor: string;
    constructor(raw_obj: JsonObject | null);
}
export declare class Activity {
    tcx_filename: string;
    activityId: string;
    sport: string;
    author: Author;
    creator: Creator;
    trackpoints: Trackpoint[];
    firstTrackpoint: Trackpoint | null;
    startingEpoch: number;
    parsedDate: string;
    constructor();
    addTrackpoint(tkpt: Trackpoint): void;
}
export interface Options {
    [key: string]: any;
}
export declare type JsonValue = boolean | number | string | JsonObject | JsonArray;
export interface JsonArray extends Array<JsonValue> {
}
export interface JsonObject {
    [k: string]: JsonValue;
}
export declare const json: JsonObject;
export declare class Parser {
    static readonly VERSION: string;
    activity: Activity;
    tcx_filename: string;
    constructor(infile: string);
    convertXmlToJson(data: string): Object;
    finish(): void;
}
