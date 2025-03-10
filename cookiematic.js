Cookiematic = class {

    constructor() {
        this.status = "inactive";
        this.interval = 1;
        this.overrideMaxBuildings = false;
        this.maxBuildings = [
            600, -1, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
            500,
        ];
        this.cpsBuffThreshold = 10;
        this.FtHoFCpsBuffThreshold = 5;
        this.isAutoClicking = false;
        this.autoFtHoF = true;
        this.autoPopGoldenCookies = true;
        this.ignoreGoldenCookieEfficiency = false;
        this.autoClickWhenBuffActive = true;
        this.autoToggleGoldenSwitch = false;
        this.autoBuyAllUpgrades = true;
        this.filteredUpgrades = ["Elder Pledge", "Elder Covenant", "Golden switch [on]", "Golden switch [off]"];
        this.autoPledge = true;
        this.autoHarvestLumps = true;
        this.autoBuyBuildings = true;
        this.autoKrumblor = false;
        this.popWrathCookies = true;

        this.__mainCycleInterval = null;
        this.__autoClickInterval = null;
    }

    __iteration = () => {
        if (this.status !== "active") {
            return;
        }

        this.autoFtHoF && this.attemptCastFtHoF();
        this.autoPopGoldenCookies && this.popGoldenCookies();

        if (this.autoClickWhenBuffActive &&
            !this.isAutoClicking &&
            (this.isClickBuffed() || this.isCpsBuffedEnough(this.cpsBuffThreshold))
        )
            {
                this.popWrinklers();
                this.startAutoClicking();
            }

        if (this.isAutoClicking && this.hasGodzamok()) {
            this.sellBuildingsForGodzamok();
        }

        if (this.isAutoClicking &&
            !this.isClickBuffed() &&
            !this.isCpsBuffedEnough(this.cpsBuffThreshold)
        ) {
                this.stopAutoClicking();
            }

        this.autoHarvestLumps && this.isSugarLumpRipe() && this.harvestSugarLump();

        this.autoToggleGoldenSwitch &&
            !this.isGoldenSwitchOn() &&
            this.isClickBuffed() &&
            this.toggleGoldenSwitch("on");
        this.isGoldenSwitchOn() &&
            !this.isClickBuffed() &&
            this.isCpsNotBuffed() &&
            this.toggleGoldenSwitch("off");

        if (!this.isGoldenSwitchOn()) {
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

    attemptCastFtHoF = () => {
        const wt = Game.Objects["Wizard tower"].minigame;

        if (wt) {
        const FtHoF = wt.spells["hand of fate"];

        if (
            wt &&
            wt.magic >= FtHoF.costMin &&
            (wt.magic === wt.magicM ||
            this.isCpsBuffedEnough(this.FtHoFCpsBuffThreshold) ||
            this.isClickBuffed())
        ) {
            if (wt.castSpell(FtHoF)) {
                console.log("Cast Force the Hand of Fate!");
            }
        }
        }
    };

    buyAllUpgrades = () => {
        if (Game.Has("Inspired checklist") && this.ignoreGoldenCookieEfficiency) {
            Game.storeBuyAll();
        } else {
            for (let i = Game.UpgradesInStore.length - 1; i >= 0; i--) {
                if (this.haveEnoughCookiesForMaxGoldenCookie(Game.UpgradesInStore[i].basePrice) && this.filteredUpgrades.indexOf(Game.UpgradesInStore[i].name) === -1) {
                    Game.UpgradesInStore[i].buy() && console.log("Bought " + Game.UpgradesInStore[i].name);
                }
            }
        }
    };

    buyElderPledge = () => {
        const pledgeUpgrade = Game.Upgrades["Elder Pledge"];
    
        if (
            Game.UpgradesInStore.indexOf(pledgeUpgrade) != -1 &&
            pledgeUpgrade.bought !== 1 &&
            this.haveEnoughCookiesForMaxGoldenCookie(pledgeUpgrade.basePrice)
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

    popWrinklers = () => {
        const closeWrinklers = Game.wrinklers.filter(({ close }) => close === 1);

        const count = closeWrinklers.length;

        if (count) {
            closeWrinklers.forEach((w) => (w.hp = 0));

            console.log("Popped " + count + " wrinkler(s)!");
        }
    };

    hasGodzamok = () => Game.Objects.Temple.minigame.gods.ruin.slot !== -1;

    sellBuildingsForGodzamok = () => {
        for (let i = 2; i < 6; i++) {
            const b = Game.ObjectsById[i];
            const amount = b.amount;

            if (amount > 0) {
                b.sell(amount);

                console.log("Sold " + amount + " " + b.name);
            }
        }
    }

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

    isSugarLumpRipe = () =>
        Game.canLumps() && Date.now() >= Game.lumpT + Game.lumpRipeAge;

    harvestSugarLump = () => {
        Game.clickLump();

        console.log("A spoonful of sugar helps the medicine go down!");
    };

    isCpsNotBuffed = () => {
        return !Object.keys(Game.buffs).length;
    };

    isGoldenSwitchOn = () => {
        return !!Game.Has("Golden switch [off]");
    };

    toggleGoldenSwitch = (status) => {
        const upgrade = Game.Upgrades["Golden switch [" + (status === "on" ? "off" : "on") + "]"];

        if (upgrade.buy()) {
            console.log("Toggled Golden Switch " + status);
        }
    };

    buyBuildingsBulk = () => {
        for (let i = Game.ObjectsN - 1; i >= 0; i--) {
            const b = Game.ObjectsById[i];
    
            const totalPrice = b.getSumPrice(Game.buyBulk);
            const canAfford = totalPrice <= Game.cookies && this.haveEnoughCookiesForMaxGoldenCookie(totalPrice);
            const haveLessThanMax = this.maxBuildings[i] === -1 || b.amount < this.maxBuildings[i];
            const shouldOverrideMaxNumber = this.overrideMaxBuildings;
    
            if (canAfford && (haveLessThanMax || shouldOverrideMaxNumber)) {
                b.buy(Game.buyBulk);
        
                console.log("Bought " + Game.buyBulk + " " + b.name);
            }
        }
    };

    haveEnoughCookiesForMaxGoldenCookie = (price) => {
        if (this.ignoreGoldenCookieEfficiency) {
            return true;
        }

        return Game.cookies >= (Game.cookiesPsRaw * 60 * 100) + price;
    };

    manageKrumblor = () => {
        if (Game.Has("A crumbly egg")) {
            if (Game.dragonLevel !== 23) {
                if (Game.dragonLevels[Game.dragonLevel].cost()) {
                Game.UpgradeDragon();
        
                console.log("One more for Krumblor!");
                }
            }
        }
    };
};
