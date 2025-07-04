import kaplay from "kaplay";
import "kaplay/global"; // uncomment if you want to use without the k. prefix

kaplay({
	background: [30, 30, 30], // OI ADD TEMPORARY POTIONS AT HOLIDAY DONT FORGET
	debug: true,
	debugKey: "1",
});

setLayers(["background", "game", "ui"], "game");
// <------------ Player Functions ---------------> //
scene("main", () => {
	flash(rgb(200, 200, 200), 0.8);
	setBackground(rgb(30, 30, 30));
	setCamScale(1.2);

	loadSprite("Backer", "/sprites/brickedas.png");

	debug.log("Welcome!");

	function explode(position, customC = [rgb(255, 255, 255)]) {
		let emitter = add([
			pos(position),
			particles({
				max: 30,
				lifeTime: [1.2, 0.8],
				colors: customC,
				speed: [100, 150],
				angle: [0, 360],
				opacities: [1, 0],
				scales: [1, 0.1]
			}, {
				direction: -90,
				spread: 360,
				rate: 5
			}),
			timer(),
			"explosion"
		]);

		emitter.emit(30);
		emitter.wait(0.6, () => {
			destroy(emitter);
		});
	}
	
	// ----------------------- Initialize ------------------- //

	add([
		sprite("Backer", {
			tiled: true,
			width: 1600,
			height: 900
		}),
		color(241, 0, 120),
		layer("background")
	]);
	
	const player = add([
		health(5),
		rect(20, 20),
		pos(200, 100),
		color(255, 255, 255),
		opacity(1),
		outline(2, rgb(0, 0, 0)),
		anchor("center"),
		area(),
		body({
			drag: 7,
		}),
		rotate(0),
		{ speed: 2150 /* Newtons */, canDash: true, isInvincible: false}
	]);

	let SPEED = 350;
	let FIRE_RATE = 0.2;

	let score = 0;
	let lastShot = 0;

	player.onUpdate(() => {
		let wp = toWorld(mousePos());
		lastShot += dt();
	
		if (isKeyDown('w')) player.addForce(vec2(0, -player.speed));
		if (isKeyDown('s')) player.addForce(vec2(0, player.speed));
		if (isKeyDown('a')) player.addForce(vec2(-player.speed, 0));
		if (isKeyDown('d')) player.addForce(vec2(player.speed, 0));

		player.pos.x = clamp(player.pos.x, 0, 1600);
		player.pos.y = clamp(player.pos.y, 0, 900);
		
		setCamPos(lerp(getCamPos(), player.pos.add((mousePos().x - width()/2) / 8,( mousePos().y - height()/2) / 8), 0.2));

		player.angle = -Math.atan2(wp.x - player.pos.x, wp.y - player.pos.y) * 180/Math.PI;

		if (isMouseDown("left") && lastShot >= FIRE_RATE) {
			lastShot = 0;
			shoot();
		}

		if (player.hp() <= 0) {
			go("gameover");
		}
	});

	onKeyPress("space", () => {
		if (player.canDash === true) {
			player.speed *= 8;
			player.isInvincible = true;
			player.canDash = false;
			player.opacity = 0.6;

			explode(player.pos);

			setTimeout(() => {
				player.speed = 2150;
				player.isInvincible = false;
				player.opacity = 1;
			}, 120);
		
			setTimeout(() => {
				player.canDash = true;
			}, 800);
		}
	});
	

	function shoot(enemy = false, customAngle, customPlace, cSpeed, size) {
		if (!enemy) {
			add([
				rect(8 || size, 8 || size),
				pos(player.pos || customPlace.pos),
				color(255, 255, 0),
				area(),
				rotate(player.angle),
				move((player.angle + 90) + rand(-4, 4)|| customAngle, 1400 || cSpeed),
				offscreen({ destroy: true }),
				{ originColor: rgb(255, 255, 0) },
				"bullet",
				"friendly"
			]);
		} else {
			add([
				circle(8 || size, 8 || size),
				health(1),
				pos(customPlace.pos),
				color(255, 0, 255),
				area(),
				move(customAngle, 800 || cSpeed),
				offscreen({ destroy: true }),
				{ originColor: rgb(255, 0, 255) },
				"bullet",
				"hostile"
			]);
		}
	}

	// ------------- Enemy Functions ---------------- //
	let spawningPaused = false;
	let boss1Status = false;

	loop(2, () => {
		if (spawningPaused) return;
		spawnEnemy();
	});

	function spawnEnemy(customHP = 5, cSpeed = 180, customC = rgb(241, 0, 120), customOt = rgb(0, 0, 0), customSize = 18) {
		let edge = Math.floor(rand(0, 4));
		let spawnX, spawnY;
		switch (edge) {
			case 0: // top
				spawnX = rand(0, 1600);
				spawnY = -20;
				break;
				
			case 1: // right
				spawnX = width() + 20;
				spawnY = rand(0, 900);
				break;
				
			case 2: // bottom
				spawnX = rand(0, 1600);
				spawnY = height() + 20;
				break;
				
			case 3: // left
				spawnX = -20;
				spawnY = rand(0, 900);
				break;
		}
		
		add([
			health(customHP),
			circle(customSize),
			pos(spawnX, spawnY),
			color(customC),
			outline(2, customOt),
			area(),
			timer(),
			{ speed: cSpeed, originColor: rgb(241, 0, 120) },
			"hostile",
			"enemy"
		]);
	}

	// Enemy Update Loop
	onUpdate("hostile", (e) => {
		const dir = player.pos.sub(e.pos).unit();
		e.move(dir.scale(e.speed));

		// RayCon Boss spawn
		if (score >= 12 && boss1Status === false) {
			add([
				health(65),
				circle(38, 38),
				rotate(0),
				pos(width()/2, 0),
				color(rgb(255, 0, 100)),
				outline(4, rgb(225, 0, 255)),
				area(),
				timer(),
				{ speed: 120, originColor: rgb(255, 0, 100) },
				"hostile",
				"enemy",
				"boss",
				"RayCon"
			]);
			debug.error("BEHOLD! THE POWER OF A JUGGERNAUT!");
			boss1Status = true;
			spawningPaused = true;
		}
	});

	// Boss1 Attacks
	let attackTimer = 0;
	let attackSwitch = 0;
	
	onUpdate("boss" && "RayCon", (bo) => {
		let targetAngle = player.pos.sub(bo.pos).unit().angle();
		attackTimer += dt();

		onUpdate("beam", (beam) => {
			beam.pos = bo.pos;
			beam.angle = lerp(beam.angle, targetAngle, 0.1);
		});
	
		if (attackTimer > 2.0) {
			switch (attackSwitch) {
				case 0:
					const DELAY = 2;
					add([
						rect(2000, 6),
						pos(bo.pos),
						anchor("left"),
						rotate(targetAngle),
						color(255, 0, 0),
						opacity(),
						scale(1),
						lifespan(DELAY),
						"beam"
					]);
					
					wait(DELAY, () => {
						add([
							rect(2000, 30),
							pos(bo.pos),
							anchor("left"),
							rotate(targetAngle),
							area(),
							lifespan(0.2, {fade: 0.1}),
							color(255, 181, 77),
							scale(1, 1),
							opacity(),
							"hostile",
							"beam"
						]);
						explode(bo.pos);
						shake(18);
						flash(rgb(255, 181, 77), 0.2);
					});
					break;

				case 1:
					loop(0.1, () => {
						shoot(true, targetAngle, bo, 1400);
						targetAngle = player.pos.sub(bo.pos).unit().angle();
					}, 12)
					break;
			}
			attackTimer = 0;
			attackSwitch = Math.floor(rand(0, 2));
		}
	});

	/* < 000000------------ Collisions -----------000000000 > */
	
	// Player-Enemy Collision
	player.onCollideUpdate("hostile", (enem) => {
		if (player.isInvincible) return;
		player.hurt(1);
		player.isInvincible = true;
		player.opacity = 0.6;
		explode(player.pos);
		shake(8);

		wait(0.6, () => {
			player.isInvincible = false;
			player.opacity = 1
		});
	});

	player.onDeath(() => {
		go("gameover");
	});

	// Enemy Collisions
	onCollide("bullet" && "friendly", "hostile" && "enemy", (b, e) => {
		b.destroy();
		explode(e.pos, [rgb(255, 100, 100), rgb(255, 0, 0)])
			e.hurt(1);
	});

	on("hurt", "hostile" && "enemy", (e) => {
		e.color = rgb(255, 255, 255);
		wait(0.1, () => {
			e.color = e.originColor;
		});
	});

	on("death", "hostile" && "enemy", (e) => {
		e.destroy();
		shake(8);
		addKaboom(e.pos);
		score += 1;
	});
	
	on("death", "boss", (bo) => {
		debug.error("AAAAAAAA-");
		debug.log("Defeated RayCon, Healed Max HP");
		bo.destroy();
		shake(108);
		player.heal(5 - player.hp());
		addKaboom(bo.pos, {
			scale: 3.5,
			speed: 0.6
		});
		score += 1;
		spawningPaused = false;
	});

// ---------- Draw UI ---------------- //

	onDraw(() => {
		drawText({
			text: "Score: " + score,
			pos: vec2(0, 0),
			size: 24,
			layer: "ui",
			fixed: true
		});

		drawRect({
			pos: vec2(0, 30),
			width: 140,
			height: 20,
			color: rgb(200, 200, 200),
			layer: "ui",
			fixed: true
		});

		drawRect({
			pos: vec2(0, 30),
			width: (player.hp()/2.5) * 70,
			height: 20,
			color: rgb(255, 0, 0),
			layer: "ui",
			fixed: true
		});
	});
});

//-----------------< Game Over >------------------\\
scene("gameover", () => {
	setBackground(rgb(0, 0, 0));

	let button = add([
		rect(200, 80),
		pos(width()/2 - 8, 400),
		scale(1),
		anchor("center"),
		color(241, 0, 120),
		area(),
		outline(8, rgb(204, 32, 142)),
		"button"
	]);

	button.onClick(() => {
		go("menu");
	});

	onUpdate(() => {
		if (button.isHovering()) {
			button.scale = lerp(button.scale, vec2(1.2, 1.2), 0.1);
		} else {
			button.scale = lerp(button.scale, vec2(1, 1), 0.1);
		}
	});
	
	onDraw(() => {
		drawText({
			text: "Game Over",
			color: rgb(255, 255, 255),
			size: 64,
			anchor: "center",
			pos: vec2(width()/2, 300),
			layer: "ui"
		});

		drawText({
			text: "Menu",
			color: rgb(255, 255, 255),
			size: 32 * button.scale.x,
			anchor: "center",
			pos: vec2(width()/2-8, 400),
			layer: "ui"
		});
	});
	flash(rgb(0, 0, 0), 0.8);
});

scene("menu", () => {
	setBackground(rgb(30, 30, 30));

	let button = add([
		rect(200, 80),
		pos(width()/2 - 8, 400),
		scale(1),
		anchor("center"),
		color(241, 0, 120),
		area(),
		outline(8, rgb(204, 32, 142)),
		"button"
	]);

	button.onClick(() => {
		go("main");
	});

	onUpdate(() => {
		if (button.isHovering()) {
			button.scale = lerp(button.scale, vec2(1.2, 1.2), 0.1);
		} else {
			button.scale = lerp(button.scale, vec2(1, 1), 0.1);
		}
	});
	
	onDraw(() => {
		drawText({
			text: "PROTOCOL SQUARIA",
			color: rgb(255, 255, 255),
			size: 64,
			anchor: "center",
			pos: vec2(width()/2, 300),
			layer: "ui"
		});

		drawText({
			text: "Play",
			color: rgb(255, 255, 255),
			size: 32 * button.scale.x,
			anchor: "center",
			pos: vec2(width()/2-8, 400),
			layer: "ui"
		});
	});
	flash(rgb(0, 0, 0), 0.8);
});

go("menu");