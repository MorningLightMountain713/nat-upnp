"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const index_flux_test_1 = require("./index.flux-test");
const src_1 = require("../src");
(0, index_flux_test_1.setupTest)("NAT-UPNP/Client", (opts) => {
    let client;
    var globalPort = [0, 0, 0, 0, 0];
    var localPort = [0, 0, 0, 0, 0];
    var num_error = 0;
    var i;
    for (i = 0; i < 5; i++) {
        globalPort[i] = ~~(Math.random() * 10000 + 30000); // 30,000 to 40,000
        localPort[i] = ~~(Math.random() * 1000 + 7000); // 7,000 to 8,000
    }
    function getMapping() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mappings = yield client.getMappings();
                var i;
                return mappings;
            }
            catch (error) {
                console.log("No Ports Mapped");
                return [];
            }
        });
    }
    opts.runBefore(() => {
        client = new src_1.Client();
    });
    opts.runAfter(() => {
        client.close();
    });
    opts.run("Get public ip address", () => __awaiter(void 0, void 0, void 0, function* () {
        const ip = yield client.getPublicIp();
        const gw = yield client.getGateway();
        console.log("Public IP %s Gateway IP %s", ip, gw.localAddress);
        return net_1.default.isIP(ip) !== 0;
    }));
    opts.run("Cache gateway and run without SSDP", () => __awaiter(void 0, void 0, void 0, function* () {
        const upnpInfo = yield client.getGateway();
        console.log(`Gateway URL is: ${upnpInfo.gateway.description}`);
        console.log(`Gatway address is ${upnpInfo.localAddress}`);
        const nonSsdpClient = new src_1.Client(upnpInfo);
        const nonSsdpupnpInfo = yield nonSsdpClient.getGateway();
        console.log(`Non Ssdp Gateway address is ${nonSsdpupnpInfo.localAddress}`);
        return nonSsdpupnpInfo.localAddress === upnpInfo.localAddress;
    }));
    opts.run("Display Existing Port Mappings", () => __awaiter(void 0, void 0, void 0, function* () {
        const mappings = yield getMapping();
        if (mappings.length == 0)
            return true;
        for (i = 0; i < mappings.length; i++) {
            console.log("Public: ", mappings[i].public.port, " Private: ", mappings[i].private.port, " Host: ", mappings[i].private.host);
        }
        return true;
    }));
    opts.run("Port mapping", () => __awaiter(void 0, void 0, void 0, function* () {
        var i;
        for (i = 0; i < 5; i++) {
            console.log("%d:Map Random port %d to Local Port %d", i + 1, globalPort[i], localPort[i]);
            yield client.createMapping({
                public: globalPort[i],
                private: localPort[i],
                ttl: 0
            });
        }
        return true;
    }));
    opts.run("Find port after mapping", () => __awaiter(void 0, void 0, void 0, function* () {
        var i;
        var passed;
        const mappings = yield getMapping();
        passed = true;
        for (i = 0; i < 5; i++) {
            var found = mappings.some((mapping) => mapping.public.port === globalPort[i]);
            console.log("Port %d found ", globalPort[i], found);
            if (!found)
                passed = false;
        }
        return passed;
    }));
    opts.run("Port unmapping", () => __awaiter(void 0, void 0, void 0, function* () {
        var i;
        for (i = 0; i < 5; i++) {
            console.log("Remove Mapping for %d", globalPort[i]);
            yield client.removeMapping({ public: globalPort[i] });
        }
        return true;
    }));
    opts.run("Verify port unmapping", () => __awaiter(void 0, void 0, void 0, function* () {
        var i;
        var passed;
        const mappings = yield getMapping();
        console.log("Mapping size ", mappings.length, mappings);
        passed = true;
        for (i = 0; i < 5; i++) {
            var found = mappings.some((mapping) => mapping.public.port === globalPort[i]);
            console.log("Port %d found ", globalPort[i], found);
            if (found)
                passed = false;
        }
        return passed;
    }));
});
