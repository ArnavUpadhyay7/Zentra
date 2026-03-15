import Phaser from "phaser";

export default class World extends Phaser.Scene {
  constructor() {
    super("world");
  }

  preload() {
    this.load.on("loaderror", (file) => {
      console.error("Phaser load error:", file.key, file.src);
    });

    this.load.tilemapTiledJSON("map", "/assets/maps/tiny-dungeon.json");
    this.load.image("tiles", "/assets/tiles/dungeon.png");

    this.load.tilemapTiledJSON("indoor", "/assets/maps/indoor.json");
    this.load.image("indoorTiles", "/assets/tiles/roguelikeSheet_transparent.png");

    for (let i = 1; i <= 6; i++) {
      this.load.spritesheet(
        `player${i}`,
        `/assets/characters/Character_${i}.png`,
        { frameWidth: 16, frameHeight: 16 },
      );
    }
  }

  createAnims(index) {
    const key = `player${index}`;
    this.anims.create({ key: `walk-up-${index}`,   frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: `walk-down-${index}`,  frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7  }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: `walk-right-${index}`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3  }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: `walk-left-${index}`,  frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3  }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: `idle-down-${index}`,  frames: [{ key, frame: 4 }], frameRate: 1 });
  }

  addOtherPlayer(id, data) {
    // Guard: never double-add the same player
    if (this.otherPlayers[id]) return;

    // charIndex must be valid (1-6), fall back to 1 if missing
    const ci      = data.charIndex || 1;
    const charKey = `player${ci}`;

    const sprite = this.physics.add.sprite(data.x, data.y, charKey);
    sprite.setScale(1.5);
    sprite.play(`idle-down-${ci}`);

    const label = this.add.text(0, 0, data.username, {
      fontSize: "6px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 3,
    });
    label.setDepth(10);
    label.setOrigin(0.5, 1);

    this.otherPlayers[id] = { sprite, label, charIndex: ci };
  }

  create() {
    // ── Read data — __vsGameData is set synchronously before new Phaser.Game() ──
    const gd          = window.__vsGameData || {};
    const socket      = gd.socket      || this.registry.get("socket");
    const myCharIndex = gd.charIndex   || this.registry.get("charIndex") || 1;
    const username    = gd.username    || this.registry.get("username")  || localStorage.getItem("vs_username") || "Player";
    const roomId      = gd.roomId      || this.registry.get("roomId");
    const mapId       = gd.mapId       || this.registry.get("mapId")     || "indoor";
    const myId        = socket.id;

    // ── Map setup ─────────────────────────────────────────────────────────────
    let map, collisionLayer;

    if (mapId === "indoor") {
      map = this.make.tilemap({ key: "indoor" });
      const tileset = map.addTilesetImage("roguelikeSheet_transparent", "indoorTiles");
      if (!tileset) console.error("Failed to load indoor tileset");
      collisionLayer = map.createLayer("Floor", tileset, 0, 0);
      collisionLayer.setCollisionByExclusion([120, 121, 698, 700], true);
      map.createLayer("Carpet",  tileset, 0, 0);
      map.createLayer("Objects", tileset, 0, 0);
      map.createLayer("Details", tileset, 0, 0);
    } else {
      map = this.make.tilemap({ key: "map" });
      const tileset = map.addTilesetImage("tileset", "tiles");
      collisionLayer = map.createLayer("Dungeon", tileset, 0, 0);
      collisionLayer.setCollisionByExclusion([49, 50, 51, 52, 53, 54, 58, 60], true);
    }

    // ── Animations ────────────────────────────────────────────────────────────
    for (let i = 1; i <= 6; i++) this.createAnims(i);

    // ── Player spawn ──────────────────────────────────────────────────────────
    // Read from __vsGameData (set before Phaser construction) — guaranteed correct.
    const defaultSpawnX = mapId === "indoor" ? 416 : Math.floor(map.widthInPixels  / 2);
    const defaultSpawnY = mapId === "indoor" ? 240 : Math.floor(map.heightInPixels / 2);
    const spawnX = gd.spawnX || this.registry.get("spawnX") || defaultSpawnX;
    const spawnY = gd.spawnY || this.registry.get("spawnY") || defaultSpawnY;

    this.player = this.physics.add.sprite(spawnX, spawnY, `player${myCharIndex}`);
    this.player.setScale(1.5);
    this.player.body.setSize(10, 10);
    this.player.body.setOffset(3, 6);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, collisionLayer);
    this.player.play(`idle-down-${myCharIndex}`);
    this.myCharIndex = myCharIndex;

    // ── Nametag ───────────────────────────────────────────────────────────────
    this.playerLabel = this.add.text(0, 0, username, {
      fontSize: "6px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 3,
    });
    this.playerLabel.setDepth(10);
    this.playerLabel.setOrigin(0.5, 1);

    // ── Other players ─────────────────────────────────────────────────────────
    this.otherPlayers = {};

    socket.emit("get-room-state", { roomId });

    socket.once("room-state", ({ players }) => {
      Object.entries(players).forEach(([id, data]) => {
        if (id === myId) return;
        this.addOtherPlayer(id, data);
      });
    });

    socket.on("player-joined", ({ players }) => {
      Object.entries(players).forEach(([id, data]) => {
        if (id === myId) return;
        this.addOtherPlayer(id, data);
      });
    });

    socket.on("player-left", ({ id }) => {
      if (this.otherPlayers[id]) {
        this.otherPlayers[id].sprite.destroy();
        this.otherPlayers[id].label.destroy();
        delete this.otherPlayers[id];
      }
    });

    socket.on("player-moved", ({ id, x, y, direction, flipX }) => {
      const other = this.otherPlayers[id];
      if (!other) return;
      other.sprite.setPosition(x, y);
      other.sprite.setFlipX(flipX);
      if (direction === "idle") {
        other.sprite.play(`idle-down-${other.charIndex}`, true);
      } else {
        other.sprite.play(`walk-${direction}-${other.charIndex}`, true);
      }
    });

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true);

    // ── Input ─────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.lastEmittedX  = null;
    this.lastEmittedY  = null;
    this.lastDirection = null;
  }

  update() {
    const speed = 65;
    this.player.body.setVelocity(0, 0);

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    let direction = "idle";

    if (left) {
      this.player.body.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.play(`walk-left-${this.myCharIndex}`, true);
      direction = "left";
    } else if (right) {
      this.player.body.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.play(`walk-right-${this.myCharIndex}`, true);
      direction = "right";
    } else if (up) {
      this.player.body.setVelocityY(-speed);
      this.player.play(`walk-up-${this.myCharIndex}`, true);
      direction = "up";
    } else if (down) {
      this.player.body.setVelocityY(speed);
      this.player.play(`walk-down-${this.myCharIndex}`, true);
      direction = "down";
    } else {
      this.player.play(`idle-down-${this.myCharIndex}`, true);
    }

    if ((left || right) && (up || down)) {
      this.player.body.velocity.normalize().scale(speed);
    }

    const moved =
      this.player.x !== this.lastEmittedX ||
      this.player.y !== this.lastEmittedY ||
      direction      !== this.lastDirection;

    if (moved) {
      const socket = this.registry.get("socket");
      const roomId = this.registry.get("roomId");

      socket.emit("player-move", {
        roomId,
        x:     this.player.x,
        y:     this.player.y,
        direction,
        flipX: this.player.flipX,
      });

      socket.emit("check-proximity");

      this.lastEmittedX  = this.player.x;
      this.lastEmittedY  = this.player.y;
      this.lastDirection = direction;
    }

    this.playerLabel.setPosition(this.player.x, this.player.y - 12);

    Object.values(this.otherPlayers).forEach(({ sprite, label }) => {
      label.setPosition(sprite.x, sprite.y - 12);
    });
  }
}