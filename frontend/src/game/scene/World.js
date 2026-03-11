import Phaser from "phaser";

export default class World extends Phaser.Scene {
  constructor() {
    super("world");
  }

  preload() {
    this.load.tilemapTiledJSON("map", "/assets/maps/tiny-dungeon.json");
    this.load.image("tiles", "/assets/tiles/dungeon.png");
    for (let i = 1; i <= 6; i++) {
      this.load.spritesheet(
        `player${i}`,
        `/assets/characters/Character_${i}.png`,
        {
          frameWidth: 16,
          frameHeight: 16,
        },
      );
    }
  }

  createAnims(index) {
    const key = `player${index}`;
    this.anims.create({
      key: `walk-up-${index}`,
      frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: `walk-down-${index}`,
      frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: `walk-right-${index}`,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: `walk-left-${index}`,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: `idle-down-${index}`,
      frames: [{ key, frame: 4 }],
      frameRate: 1,
    });
  }

  addOtherPlayer(id, data) {
    const charKey = `player${data.charIndex}`;

    const sprite = this.physics.add.sprite(data.x, data.y, charKey);
    sprite.setScale(1.5);
    sprite.play(`idle-down-${data.charIndex}`);

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

    // Store both sprite and label together under this player's socket id
    this.otherPlayers[id] = { sprite, label, charIndex: data.charIndex };
  }

  create() {
    // ── Map ───────────────────────────────────────────────────────────────────
    const map = this.make.tilemap({
      key: "map",
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset = map.addTilesetImage("tileset", "tiles", 16, 16, 0, 0);
    const dungeonLayer = map.createLayer("Dungeon", tileset, 0, 0);
    const floorTileIds = [49, 50, 51, 52, 53, 54, 58, 60];
    dungeonLayer.setCollisionByExclusion(floorTileIds, true);

    // ── Animations for all 6 characters ──────────────────────────────────────
    // Instead of hardcoding 5 animation keys, we loop and create indexed keys
    // for all 6 characters at once. Total: 30 animations (5 × 6)
    for (let i = 1; i <= 6; i++) this.createAnims(i);

    // ── Read registry values set by Game.jsx ──────────────────────────────────
    // Game.jsx passes socket, roomId, myId, charIndex via Phaser's registry
    // registry is a key-value store that survives scene transitions
    const socket = this.registry.get("socket");
    const myId = socket.id;
    const myCharIndex = this.registry.get("charIndex") || 1;
    const username =
      this.registry.get("username") ||
      localStorage.getItem("vs_username") ||
      "Player";

    // ── My player sprite ──────────────────────────────────────────────────────
    // Now uses myCharIndex instead of hardcoded "player" texture
    this.player = this.physics.add.sprite(256, 160, `player${myCharIndex}`);
    this.player.setScale(1.5);
    this.player.body.setSize(10, 10);
    this.player.body.setOffset(3, 6);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, dungeonLayer);
    this.player.play(`idle-down-${myCharIndex}`);

    // Store charIndex on the scene so update() can use it for animation keys
    this.myCharIndex = myCharIndex;

    // ── My nametag ────────────────────────────────────────────────────────────
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

    // ── Other players map ─────────────────────────────────────────────────────
    // Keyed by socket id: { [id]: { sprite, label, charIndex } }
    this.otherPlayers = {};

    // Request current players already in the room
    // This handles the case where you join after others are already present
    const roomId = this.registry.get("roomId");
    socket.emit("get-room-state", { roomId });

    socket.once("room-state", ({ players }) => {
      Object.entries(players).forEach(([id, data]) => {
        if (id === myId) return;
        if (this.otherPlayers[id]) return;
        this.addOtherPlayer(id, data);
      });
    });

    // ── Socket events ─────────────────────────────────────────────────────────

    // "player-joined" fires when ANY player joins — including yourself initially
    // The server sends the full players object so we can catch up on everyone
    socket.on("player-joined", ({ players }) => {
      Object.entries(players).forEach(([id, data]) => {
        if (id === myId) return; // skip ourselves
        if (this.otherPlayers[id]) return; // already rendered, skip
        this.addOtherPlayer(id, data);
      });
    });

    // "player-left" fires when someone disconnects
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
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // ── Movement emission tracking ────────────────────────────────────────────
    // We only emit when position actually changes, not every frame
    this.lastEmittedX = null;
    this.lastEmittedY = null;
    this.lastDirection = null;
  }

  update() {
    const speed = 65;
    this.player.body.setVelocity(0, 0);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    // Track current direction for emitting to other players
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

    // ── Emit movement only when position or direction changes ─────────────────
    // Comparing to last emitted values avoids flooding the server at 60fps
    const moved =
      this.player.x !== this.lastEmittedX ||
      this.player.y !== this.lastEmittedY ||
      direction !== this.lastDirection;

    if (moved) {
      const socket = this.registry.get("socket");
      const roomId = this.registry.get("roomId");

      socket.emit("player-move", {
        roomId,
        x: this.player.x,
        y: this.player.y,
        direction,
        flipX: this.player.flipX,
      });

      this.lastEmittedX = this.player.x;
      this.lastEmittedY = this.player.y;
      this.lastDirection = direction;
    }

    this.playerLabel.setPosition(this.player.x, this.player.y - 12);

    Object.values(this.otherPlayers).forEach(({ sprite, label }) => {
      label.setPosition(sprite.x, sprite.y - 12);
    });
  }
}
