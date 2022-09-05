"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const xml2js = require("xml2js");
class Timestamp {
    constructor(time_str) {
        this.date = new Date();
        this.epochMilliseconds = 0;
        this.time_str = time_str;
        try {
            this.date = new Date(time_str);
            this.epochMilliseconds = this.date.getTime();
        }
        catch (e) {
            console.log(e);
        }
    }
    isValid() {
        return this.epochMilliseconds > 0;
    }
    toString() {
        return "Timestamp: " + this.isValid() + ", " + this.time_str + ", " + this.date + ", " + this.epochMilliseconds;
    }
}
exports.Timestamp = Timestamp;
class ElapsedTime {
    constructor(elapsedMs) {
        this.secs = 0;
        this.hh = 0;
        this.mm = 0;
        this.ss = 0;
        this.elapsedMs = Math.abs(elapsedMs);
        this.secs = Math.round(this.elapsedMs / ElapsedTime.MILLISECONDS_PER_SECOND);
        this.hh = Math.floor(this.secs / ElapsedTime.SECONDS_PER_HOUR);
        let rem = this.secs - (this.hh * ElapsedTime.SECONDS_PER_HOUR);
        this.mm = Math.floor(rem / 60.0);
        this.ss = rem - (this.mm * 60.0);
        if (this.mm > 59) {
            console.log("ElapsedTime mm normalized to 59 - " + this.mm);
            this.mm = 59;
        }
        if (this.ss > 59) {
            console.log("ElapsedTime ss normalized to 59 - " + this.ss);
            this.ss = 59;
        }
    }
    static get MILLISECONDS_PER_SECOND() { return 1000.0; }
    static get SECONDS_PER_HOUR() { return 3600.0; }
    static get SECONDS_PER_MINUTE() { return 60.0; }
    asHHMMSS() {
        return this.zeroPad(this.hh) + ":" + this.zeroPad(this.mm) + ":" + this.zeroPad(this.ss);
    }
    zeroPad(i) {
        if (i < 10) {
            return "0" + i;
        }
        else {
            return "" + i;
        }
    }
}
exports.ElapsedTime = ElapsedTime;
class GeoJsonLocation {
    constructor(latitude, longitude) {
        this.type = 'Point';
        this.coordinates = [longitude, latitude];
    }
}
exports.GeoJsonLocation = GeoJsonLocation;
class Trackpoint {
    constructor(raw_obj, sequence) {
        this.doctype = 'trackpoint';
        this.time = null;
        this.seq = null;
        this.latitude = 0;
        this.longitude = 0;
        this.altitude_meters = null;
        this.altitude_feet = null;
        this.distance_meters = 0;
        this.distance_miles = null;
        this.distance_km = null;
        this.distance_yds = null;
        this.heart_rate_bpm = null;
        this.speed = null;
        this.cadence = null;
        this.watts = null;
        this.location = null;
        this.elapsed_sec = null;
        this.elapsed_hhmmss = null;
        this.epoch_ms = -1;
        this.seq = sequence;
        this.epoch_ms = -1;
        let keys = Object.keys(raw_obj);
        if (keys.includes("Time")) {
            this.time = raw_obj["Time"];
        }
        else {
            this.time = Trackpoint.DEFAULT_EPOCH_TIMESTAMP_STRING;
        }
        try {
            let ts = new Timestamp(this.time);
            this.epoch_ms = ts.epochMilliseconds;
        }
        catch (e) {
            console.log(e);
        }
        if (keys.includes("Position")) {
            try {
                let position = raw_obj["Position"];
                this.latitude = Number(position["LatitudeDegrees"]);
                this.longitude = Number(position["LongitudeDegrees"]);
            }
            catch (e) {
                console.log(e);
            }
        }
        if (keys.includes("AltitudeMeters")) {
            this.altitude_meters = Number(raw_obj["AltitudeMeters"]);
        }
        if (keys.includes("DistanceMeters")) {
            this.distance_meters = Number(raw_obj["DistanceMeters"]);
        }
        if (keys.includes("HeartRateBpm")) {
            try {
                let hr = raw_obj["HeartRateBpm"];
                this.heart_rate_bpm = Number(hr["Value"]);
            }
            catch (e) {
                console.log(e);
            }
        }
        if (keys.includes("Cadence")) {
            this.cadence = Number(raw_obj["Cadence"]);
        }
        if (keys.includes("Extensions")) {
            try {
                let ext = raw_obj["Extensions"];
                let ext_keys = Object.keys(ext);
                if (ext_keys.includes("TPX")) {
                    let tpx = ext["TPX"];
                    let tpx_keys = Object.keys(tpx);
                    if (tpx_keys.includes("Speed")) {
                        this.speed = Number(tpx["Speed"]);
                    }
                    if (tpx_keys.includes("RunCadence")) {
                        this.cadence = Number(tpx["RunCadence"]);
                    }
                    if (tpx_keys.includes("Watts")) {
                        this.watts = Number(tpx["Watts"]);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
    static get DEFAULT_EPOCH_TIMESTAMP_STRING() { return "1970-01-01T00:00:00.000Z"; }
    static get MILES_PER_KILOMETER() { return 0.621371192237334; }
    static get YARDS_PER_MILE() { return 1760.0; }
    static get FEET_PER_METER() { return 3.280839895013123; }
    addAltitudeFeet() {
        if (this.altitude_meters) {
            try {
                this.altitude_meters = Number(this.altitude_meters);
                this.altitude_feet = this.altitude_meters * Trackpoint.FEET_PER_METER;
            }
            catch (e) {
                console.log(e);
            }
        }
    }
    addDistances() {
        if (this.distance_meters !== null) {
            try {
                this.distance_km = this.distance_meters / 1000.0;
                this.distance_miles = this.distance_km * Trackpoint.MILES_PER_KILOMETER;
                this.distance_yds = this.distance_miles * Trackpoint.YARDS_PER_MILE;
            }
            catch (e) {
                console.log(e);
            }
        }
    }
    calculateElapsed(startingEpoch) {
        let elapsedMs = this.epoch_ms - startingEpoch;
        let et = new ElapsedTime(elapsedMs);
        this.elapsed_sec = et.secs;
        this.elapsed_hhmmss = et.asHHMMSS();
    }
    addGeoJson() {
        try {
            let lat = this.latitude;
            let lng = this.longitude;
            this.location = new GeoJsonLocation(lat, lng);
        }
        catch (e) {
            console.log(e);
        }
    }
    cleanup() {
    }
}
exports.Trackpoint = Trackpoint;
class Author {
    constructor(raw_obj) {
        this.type = 'Author';
        this.name = '';
        this.part_number = '';
        this.lang = '';
        this.build_major = '';
        this.build_minor = '';
        this.version_major = '';
        this.version_minor = '';
        if (raw_obj !== null) {
            this.name = raw_obj["Name"];
            this.lang = raw_obj["LangID"];
            this.part_number = raw_obj["PartNumber"];
            let build = raw_obj["Build"];
            let vers = build["Version"];
            this.version_major = vers["VersionMajor"];
            this.version_minor = vers["VersionMinor"];
            this.build_major = vers["BuildMajor"];
            this.build_minor = vers["BuildMinor"];
        }
    }
}
exports.Author = Author;
class Creator {
    constructor(raw_obj) {
        this.type = 'Creator';
        this.name = '';
        this.product_id = '';
        this.unit_id = '';
        this.build_major = '';
        this.build_minor = '';
        this.version_major = '';
        this.version_minor = '';
        if (raw_obj !== null) {
            this.name = raw_obj["Name"];
            this.unit_id = raw_obj["UnitId"];
            this.product_id = raw_obj["ProductID"];
            let vers = raw_obj["Version"];
            this.version_major = vers["VersionMajor"];
            this.version_minor = vers["VersionMinor"];
            this.build_major = vers["BuildMajor"];
            this.build_minor = vers["BuildMinor"];
        }
    }
}
exports.Creator = Creator;
class Activity {
    constructor() {
        this.tcx_filename = "";
        this.activityId = "";
        this.sport = "";
        this.trackpoints = new Array();
        this.firstTrackpoint = new Trackpoint({}, 0);
        this.startingEpoch = 0;
        this.parsedDate = new Date().toISOString();
        this.sport = "";
        this.author = new Author(null);
        this.creator = new Creator(null);
    }
    addTrackpoint(tkpt) {
        this.trackpoints.push(tkpt);
        if (this.trackpoints.length === 1) {
            this.firstTrackpoint = tkpt;
            this.startingEpoch = tkpt.epoch_ms;
        }
    }
}
exports.Activity = Activity;
exports.json = {};
class Parser {
    constructor(infile) {
        this.activity = new Activity();
        this.tcx_filename = '';
        this.tcx_filename = infile;
        this.activity.tcx_filename = infile;
        let tcx_xml_str = fs.readFileSync(infile).toString();
        let root_obj = this.convertXmlToJson(tcx_xml_str);
        let tcdb = root_obj["TrainingCenterDatabase"];
        let tcdb_file = this.tcx_filename + ".json";
        let activities = tcdb["Activities"];
        let activity = activities["Activity"];
        this.activity.activityId = activity["Id"];
        try {
            let activityDollar = activity["$"];
            this.activity.sport = activityDollar["Sport"];
        }
        catch (e) {
            console.log(e);
        }
        try {
            let author_data = tcdb["Author"];
            this.activity.author = new Author(author_data);
        }
        catch (e) {
        }
        try {
            let creator_data = activity["Creator"];
            this.activity.creator = new Creator(creator_data);
        }
        catch (e) {
        }
        let lapObj = activity["Lap"];
        let tkpt_seq = 0;
        if (Array.isArray(lapObj)) {
            let laps = activity["Lap"];
            let lap_count = laps.length;
            for (var i = 0; i < lap_count; i++) {
                let curr_lap = laps[i];
                let curr_track = curr_lap["Track"];
                let curr_tkpts = curr_track["Trackpoint"];
                let curr_tkpt_length = curr_tkpts.length;
                for (var t = 0; t < curr_tkpt_length; t++) {
                    tkpt_seq++;
                    let tkpt_data = curr_tkpts[t];
                    this.activity.addTrackpoint(new Trackpoint(tkpt_data, tkpt_seq));
                }
            }
        }
        else {
            let curr_lap = lapObj;
            let curr_track = curr_lap["Track"];
            let curr_tkpts = curr_track["Trackpoint"];
            let curr_tkpt_length = curr_tkpts.length;
            for (var t = 0; t < curr_tkpt_length; t++) {
                tkpt_seq++;
                let tkpt_data = curr_tkpts[t];
                this.activity.addTrackpoint(new Trackpoint(tkpt_data, tkpt_seq));
            }
        }
        let startingEpoch = this.activity.startingEpoch;
        for (var i = 0; i < this.activity.trackpoints.length; i++) {
            this.activity.trackpoints[i].addAltitudeFeet();
            this.activity.trackpoints[i].addDistances();
            this.activity.trackpoints[i].calculateElapsed(startingEpoch);
            this.activity.trackpoints[i].addGeoJson();
            this.activity.trackpoints[i].cleanup();
        }
        this.activity.firstTrackpoint = null;
    }
    static get VERSION() { return "1.0.1"; }
    convertXmlToJson(data) {
        let res = {};
        xml2js.parseString(data, { explicitArray: false }, (error, result) => {
            if (error) {
                throw new Error(error);
            }
            else {
                res = result;
            }
        });
        return res;
    }
    finish() {
    }
}
exports.Parser = Parser;
//# sourceMappingURL=tcx.js.map