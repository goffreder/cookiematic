Cookiematic = class {

    constructor() {
        this.status = "inactive";
        this.interval = 100;
        this.overrideMaxBuildings = false;
        this.maxBuildings = [
        600, -1, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
        500,
        ];
        this.cpsBuffThreshold = 40;
        this.isAutoClicking = false;
        this.autoPopGoldenCookies = true;
        this.autoClickWhenBuffActive = true;
        this.autoToggleGoldenSwitch = true;
        this.autoBuyAllUpgrades = true;
        this.autoPledge = false;
        this.autoBuyBuildings = true;
        this.autoKrumblor = false;
        this.__mainCycleInterval = null;
    }

    __iteration = () => {
        if (this.status !== "active") {
            return;
        }

        this.autoPopGoldenCookies && this.popGoldenCookies();

        this.autoClickWhenBuffActive &&
            !this.isAutoClicking &&
            (this.isClickBuffed() || this.isCpsBuffedEnough(this.cpsBuffThreshold)) &&
            this.startAutoClicking();
        this.isAutoClicking &&
            !this.isClickBuffed() &&
            !this.isCpsBuffedEnough(this.cpsBuffThreshold) &&
            this.stopAutoClicking();

        this.autoToggleGoldenSwitch &&
            !this.isGoldenSwitchOn() &&
            this.isClickBuffed() &&
            this.toggleGoldenSwitch("on");
        this.isGoldenSwitchOn() &&
            !this.isClickBuffed() &&
            this.isCpsNotBuffed() &&
            this.toggleGoldenSwitch("off");

        if (!this.isGoldenSwitchOn() && this.haveEnoughCookiesForMaxGoldenCookie()) {
            // check if I have enough cookies in bank for max golden cookie
            // Will give the most cookies if cookies banked is 100 minutes (1 hour 40 mins) of CpS
            this.autoBuyAllUpgrades && this.buyAllUpgrades();
            this.autoPledge && this.buyElderPledge();

            if (this.autoBuyBuildings) {
                this.buyBuildingsBulk();
            }

            this.autoKrumblor && this.manageKrumblor();
        }
    };

    dumpStatus = () => {
        console.log(
        Object.entries(this)
            .filter(
                ([key, value]) =>
                key.indexOf("__") !== 0 &&
                ["boolean", "string", "number"].indexOf(typeof value) !== -1
            )
            .reduce((dump, [key, value]) => ({ ...dump, [key]: value }), {})
        );
    };

    activate = () => {
        this.__mainCycleInterval = setInterval(this.__iteration, this.interval);
        this.status = "active";
    };

    deactivate = () => {
        this.__mainCycleInterval !== null &&
            clearInterval(this.__mainCycleInterval);
        this.__mainCycleInterval = null;
    
        this.status = "inactive";
    };

    buyAllUpgrades = () => {
        if (Game.Has("Inspired checklist")) {
            Game.storeBuyAll();
        } else {
            for (let i = Game.UpgradesInStore.length - 1; i >= 0; i--) {
            Game.UpgradesInStore[i].buy();
            }
        }
    };

    buyElderPledge = () => {
        const pledgeUpgrade = Game.Upgrades["Elder Pledge"];
    
        if (
            Game.UpgradesInStore.indexOf(pledgeUpgrade) != -1 &&
            pledgeUpgrade.bought !== 1
        ) {
            pledgeUpgrade.buy();
    
            console.log("Pledged to the elders once again!");
        }
    };

    popGoldenCookies = () => {
        const goldenCookies = Game.shimmers.filter(
            (s) => s.type === "golden" && (this.popWrathCookies || s.wrath === 0)
        );
    
        const count = goldenCookies.length;
    
        if (count) {
            goldenCookies.forEach((gc) => gc.pop());
    
            console.log("Popped " + count + " golden cookie(s)!");
        }
    };

    startAutoClicking = () => {
        this.__autoClickInterval = setInterval(Game.ClickCookie, 100);
    
        this.isAutoClicking = true;
    
        console.log("Click and/or CpS is buffed! Start autoclicking...");
    };

    stopAutoClicking = () => {
        this.__autoClickInterval !== null &&
            clearInterval(this.__autoClickInterval);
        this.__autoClickInterval = null;
    
        this.isAutoClicking = false;
    
        console.log("Click/CpS buff ended, stop autoclicking :(");
    };

    isCpsBuffedEnough = (threshold) => {
        let cpsBuff = 1;
    
        for (var i in Game.buffs) {
            var b = Game.buffs[i];
    
            if (typeof b.multCpS !== undefined) {
            cpsBuff *= b.multCpS;
            }
        }
    
        return cpsBuff >= threshold;
    };

    isClickBuffed = () => {
        for (var i in Game.buffs) {
            var b = Game.buffs[i];
    
            if (
            b.name === "Cursed finger" ||
            (typeof b.multClick !== undefined && b.multClick > 1)
            ) {
            return true;
            }
        }
    
        return false;
    };

    isCpsNotBuffed = () => {
        return !Object.keys(Game.buffs).length;
    };

    isGoldenSwitchOn = () => {
        return !!Game.Has("Golden switch [off]");
    };

    toggleGoldenSwitch = (status) => {
        if (
            Game.Upgrades[
            "Golden switch [" + (status === "on" ? "off" : "on") + "]"
            ].buy()
        ) {
            console.log("Toggled Golden Switch " + status);
        }
    };

    buyBuildingsBulk = () => {
        for (let i = Game.ObjectsN - 1; i >= 0; i--) {
            const b = Game.ObjectsById[i];
    
            const canAfford = b.getSumPrice(Game.buyBulk) <= Game.cookies;
            const haveLessThanMax =
            this.maxBuildings[i] === -1 || b.amount < this.maxBuildings[i];
            const shouldOverrideMaxNumber = this.overrideMaxBuildings;
    
            if (canAfford && (haveLessThanMax || shouldOverrideMaxNumber)) {
            b.buy(Game.buyBulk);
    
            console.log("Bought " + Game.buyBulk + " " + b.name);
            }
        }
    };

    haveEnoughCookiesForMaxGoldenCookie = () => {
        return Game.cookies >= Game.cookiesPs * 60 * 100;
    };
};
