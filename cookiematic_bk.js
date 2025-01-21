Cookiematic = class {
  constructor(interval, debug = false) {
    this.status = "inactive";
    this.interval = interval;
    this.debug = debug;

    this.overrideMaxBuildings = false;
    this.maxBuildings = [
      600, -1, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
      500, 500,
    ];

    this.garden = {
      mode: "default",
      plants: {
        dontHarvest: [23, 24],
      },
    };

    this.cpsBuffThreshold = 40;
    this.isAutoClicking = false;

    this.autoPopGoldenCookies = true;
    this.autoPopWrinklers = false;
    this.autoPopReindeers = true;
    this.autoFtHoF = true;
    this.autoClickWhenBuffActive = true;
    this.autoBuyAllUpgrades = true;
    this.autoBuyBuildings = true;
    this.autoPledge = false;
    this.autoHarvestLumps = true;
    this.autoToggleGoldenSwitch = true;
    this.autoKrumblor = false;
    this.autoFortuneCookie = true;

    this.autoManageGarden = true;

    this.popWrathCookies = true;
    this.popCloseWrinklersOnly = true;

    this.__mainCycleInterval = null;
    this.__autoClickInterval = null;

    this.fortuneCookies = [
      "The fortune you seek is in another cookie.",
      "A closed mouth gathers no feet.",
      "A conclusion is simply the place where you got tired of thinking.",
      "A cynic is only a frustrated optimist.",
      "A foolish man listens to his heart. A wise man listens to cookies.",
      "You will die alone and poorly dressed.",
      "A fanatic is one who can't change his mind, and won't change the subject.",
      "If you look back, you'll soon be going that way.",
      "You will live long enough to open many fortune cookies.",
      "An alien of some sort will be appearing to you shortly.",
      "Do not mistake temptation for opportunity.",
      "Flattery will go far tonight.",
      "He who laughs at himself never runs out of things to laugh at.",
      "He who laughs last is laughing at you.",
      "He who throws dirt is losing ground.",
      "Some men dream of fortunes, others dream of cookies.",
      "The greatest danger could be your stupidity.",
      "We don't know the future, but here's a cookie.",
      "The world may be your oyster, but it doesn't mean you'll get its pearl.",
      "You will be hungry again in one hour.",
      "The road to riches is paved with homework.",
      "You can always find happiness at work on Friday.",
      "Actions speak louder than fortune cookies.",
      "Because of your melodic nature, the moonlight never misses an appointment.",
      "Don't behave with cold manners.",
      "Don't forget you are always on our minds.",
      "Fortune not found? Abort, Retry, Ignore.",
      "Help! I am being held prisoner in a fortune cookie factory.",
      "It's about time I got out of that cookie.",
      "Never forget a friend. Especially if he owes you.",
      "Never wear your best pants when you go to fight for freedom.",
      "Only listen to the fortune cookie; disregard all other fortune telling units.",
      "It is a good day to have a good day.",
      "All fortunes are wrong except this one.",
      "Someone will invite you to a Karaoke party.",
      "That wasn't chicken.",
      "There is no mistake so great as that of being always right.",
      "You love Chinese food.",
      "I am worth a fortune.",
      "No snowflake feels responsible in an avalanche.",
      "You will receive a fortune cookie.",
      "Some fortune cookies contain no fortune.",
      "Don't let statistics do a number on you.",
      "You are not illiterate.",
      "May you someday be carbon neutral.",
      "You have rice in your teeth.",
      "Avoid taking unnecessary gambles. Lucky numbers: 12, 15, 23, 28, 37",
      "Ask your mom instead of a cookie.",
      "This cookie contains 117 calories.",
      "Hard work pays off in the future. Laziness pays off now.",
      "You think it's a secret, but they know.",
      "If a turtle doesn't have a shell, is it naked or homeless?",
      "Change is inevitable, except for vending machines.",
      "Don't eat the paper.",
    ];
  }

  __iteration = () => {
    if (this.status !== "active") {
      return;
    }

    !Game.unbuffedCps && Game.ClickCookie(); // clicks the cookie is the Cps is not unbuffed

    this.autoFtHoF && this.attemptCastFtHoF(); // auto casts force the hand of fate
    this.autoPopGoldenCookies && this.popGoldenCookies();
    this.autoPopWrinklers && this.popWrinklers();
    this.autoPopReindeers && this.popReindeers();

    this.autoClickWhenBuffActive &&
      !this.isAutoClicking &&
      (this.isClickBuffed() || this.isCpsBuffedEnough(this.cpsBuffThreshold)) &&
      this.startAutoClicking();
    this.isAutoClicking &&
      !this.isClickBuffed() &&
      !this.isCpsBuffedEnough(this.cpsBuffThreshold) &&
      this.stopAutoClicking();

    this.autoHarvestLumps && this.isSugarLumpRipe() && this.harvestSugarLump();

    this.autoToggleGoldenSwitch &&
      !this.isGoldenSwitchOn() &&
      this.isClickBuffed() &&
      this.toggleGoldenSwitch("on");
    this.isGoldenSwitchOn() &&
      !this.isClickBuffed() &&
      this.isCpsNotBuffed() &&
      this.toggleGoldenSwitch("off");

    this.autoFortuneCookie &&
      this.isFortuneCookie() &&
      this.clickFortuneCookie();

    if (!this.isGoldenSwitchOn()) {
      this.autoBuyAllUpgrades && this.buyAllUpgrades();
      this.autoPledge && this.buyElderPledge();

      if (this.autoBuyBuildings) {
        if (Game.BuildingsOwned % 10 !== 0) {
          this.roundBuildingsNumber();
        } else {
          Game.buyBulk === 10 && this.buyBuildingsBulk();
        }
      }

      this.autoKrumblor && this.manageKrumblor();
    }

    this.autoManageGarden && this.manageGarden();

    this.debug && this.dumpStatus();
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

  setDebugMode = (status = true) => (this.debug = status);
  setPopWrathCookies = (status = true) => (this.popWrathCookies = status);

  setAutoBuyAllUpgrades = (status = true) => (this.autoBuyAllUpgrades = status);
  setAutoBuyBuildings = (status = true) => (this.autoBuyBuildings = status);
  setAutoPopGoldenCookies = (status = true) =>
    (this.autoPopGoldenCookies = status);
  setAutoPopWrinklers = (status = false) => (this.autoPopWrinklers = status);
  setAutoPopReindeers = (status = true) => (this.autoPopReindeers = status);
  setAutoFtHoF = (status = true) => (this.autoFtHoF = status);
  setAutoClickWhenBuffActive = (status = true) =>
    (this.autoClickWhenBuffActive = status);
  setAutoPledge = (status = true) => (this.autoPledge = status);
  setAutoHarvestLumps = (state = true) => (this.autoHarvestLumps = status);
  setCpSBuffThreshold = (threshold = 40) => (this.cpsBuffThreshold = threshold);
  setOverrideMaxBuildings = (status = false) =>
    (this.overrideMaxBuildings = status);
  setAutoToggleGoldenSwitch = (status = true) =>
    (this.autoToggleGoldenSwitch = status);
  setAutoKrumblor = (status = true) => (this.autoKrumblor = status);
  setAutoFortuneCookie = (status = true) => (this.autoFortuneCookie = status);

  setAutoManageGarden = (status = true) => (this.autoManageGarden = status);
  setGardenMode = (mode = "default") => (this.garden.mode = mode);

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

  isCpsNotBuffed = () => !Object.keys(Game.buffs).length;

  isGoldenSwitchOn = () => !!Game.Has("Golden switch [off]");

  isFortuneCookie = () =>
    Game.TickerEffect && Game.TickerEffect.type === "fortune";

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

  popReindeers = () => {
    const reindeers = Game.shimmers.filter((s) => s.type === "reindeer");

    const count = reindeers.length;

    if (count) {
      reindeers.forEach((r) => r.pop());

      console.log("Popped " + count + " reindeer(s)!");
    }
  };

  attemptCastFtHoF = () => {
    const wt = Game.Objects["Wizard tower"].minigame;

    if (wt) {
      const FtHoF = wt.spells["hand of fate"];

      if (
        wt &&
        wt.magic >= FtHoF.costMin &&
        (wt.magic === wt.magicM ||
          this.isCpsBuffedEnough(this.cpsBuffThreshold) ||
          this.isClickBuffed())
      ) {
        if (wt.castSpell(FtHoF)) {
          console.log("Cast Force the Hand of Fate!");
        }
      }
    }
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

  roundBuildingsNumber = () => {
    for (let i = Game.ObjectsN - 1; i >= 0; i--) {
      const b = Game.ObjectsById[i];

      const canAfford = b.getSumPrice(1) <= Game.cookies;
      const isntRounded = b.amount !== 0 && b.amount % 10 !== 0;

      if (canAfford && isntRounded) {
        b.buy(1);

        console.log("Bought 1 " + b.name);
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

  isSugarLumpRipe = () =>
    Game.canLumps() && Date.now() >= Game.lumpT + Game.lumpRipeAge;

  harvestSugarLump = () => {
    Game.clickLump();

    console.log("A spoonful of sugar helps the medicine go down!");
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

  clickFortuneCookie = () => {
    Game.tickerL && Game.tickerL.click();

    console.log(
      this.fortuneCookies[
        Math.floor(Math.random() * Math.floor(this.fortuneCookies.length - 1))
      ]
    );
  };

  // 0 nothing, 1 growing, 2 mature, 3 dying
  getPlantStage = (plant, tile) => {
    if (!tile[0]) {
      return "missing";
    }

    if (tile[1] + Math.ceil(plant.ageTick + plant.ageTickR) >= 100) {
      return "dying";
    } else if (tile[1] >= plant.mature) {
      return "mature";
    }

    return "growing";
  };

  manageGarden = () => {
    const garden = Game.Objects["Farm"].minigame;

    if (!garden) {
      return;
    }

    let newPlantId = false;

    // detect actions
    if (this.garden.mode === "cloverfield") {
      const ordinaryCloverId = 4;

      if (garden.plantsById[ordinaryCloverId].unlocked) {
        newPlantId = ordinaryCloverId;
      }
    }

    // autoharvest plants
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const tile = garden.getTile(i, j);
        const plant = tile[0] ? garden.plantsById[tile[0] - 1] : null;

        if (plant) {
          const status = this.getPlantStage(plant, tile);
          let harvest = false;

          if (status === "mature" && plant.unlocked === 0) {
            harvest = true;
          }

          if (
            status === "dying" &&
            this.garden.plants.dontHarvest.indexOf(plant.id) === -1
          ) {
            harvest = true;
          }

          if (harvest) {
            garden.useTool(null, i, j);

            console.log(`Harvested ${status} ${plant.name} at (${i}, ${j})`);
          }
        } else {
          if (!this.isGoldenSwitchOn() && this.isCpsNotBuffed() && newPlantId) {
            if (garden.useTool(newPlantId, i, j)) {
              console.log(
                `Planted ${garden.plantsById[newPlantId].name} at (${i}, ${j})`
              );
            }
          }
        }
      }
    }
  };
};
