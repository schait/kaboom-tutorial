kaboom({
    scale: 1.5
  });

loadSprite("space", "/static/sprites/space.jpg");
loadSprite("rocket1", "/static/sprites/rocket1.png");
loadSprite("rocket2", "/static/sprites/rocket2.png");
loadSprite("rocket3", "/static/sprites/rocket3.png");
loadSprite("rocket4", "/static/sprites/rocket4.png");
loadSprite("ship", "/static/sprites/ship.png");
loadSprite("bullet", "/static/sprites/bullet.png");
loadSprite("asteroid", "/static/sprites/asteroid.png");
loadSprite("asteroid_small1", "/static/sprites/asteroid_small1.png");
loadSprite("asteroid_small2", "/static/sprites/asteroid_small2.png");
loadSprite("asteroid_small3", "/static/sprites/asteroid_small3.png");
loadSprite("asteroid_small4", "/static/sprites/asteroid_small4.png");

loadSound("rocket_thrust", "/static/sounds/rocket_thrust.wav");
loadSound("laser", "/static/sounds/laser.wav");
loadSound("explosion", "/static/sounds/explosion.mp3");
loadSound("Steamtech-Mayhem_Looping","/static/sounds/Steamtech-Mayhem_Looping.mp3");

scene("main", ()=> {
  layers([
    "bg",
    "obj",
    "ui",
  ], "obj");

  // BACKGROUND
  add([
    sprite("space"),
    layer("bg")
  ]);
  
  // UI
  let score = 0;

  const NUM_ASTEROIDS = 5;
  let asteroidsRemaining = NUM_ASTEROIDS;

  ui = add([
    layer("ui")
  ]);


  ui.on("draw", () => {
    drawText({
      text: "Score: " + score,
      size: 14,
      font: "sink",
      pos: vec2(8, 24)  // literally just a screen position: x=8, y=24.
    })

    drawText({
      text: "Lives: ",
      size: 12,
      font: "sink",
      pos: vec2(8),
    });
    for (let x = 64; x < 64 + (16 * player.lives); x += 16) {
      drawSprite({
        sprite: "ship",
        pos: vec2(x, 12),
        angle: -90,
        origin: "center",
        scale: 0.5
      });
    }
  });

  // MOVEMENT MECHANICS
  function pointAt(distance, angle) {
    let radians = -1*deg2rad(angle);
    return vec2(distance * Math.cos(radians), -distance * Math.sin(radians));    
  }
  
  // Anything that moves gets the "mobile" label and this function is called to update it
  onUpdate("mobile", (e) => {
    e.move(pointAt(e.speed, e.angle));
  });

  // ASTEROID SPAWN MECHANICS

  function asteroidSpawnPoint() {
    return choose([rand(vec2(0), vec2(width(), 0)),
                  rand(vec2(0), vec2(0, height())),
                  rand(vec2(0, height()), vec2(width(), height())),
                  rand(vec2(width(), 0), vec2(width(), height()))]);
  }
  
  // SHIP
  const player = add([
    sprite("ship"),
    pos(160,120),
    rotate(0),
    origin("center"),
    solid(),
    area(),
    "player",
    "mobile",
    "wraps",
    {
      turn_speed: 4.58,
      speed: 0,
      max_thrust: 48,
      acceleration: 2,
      deceleration: 4,
      lives: 3,
      can_shoot: true,
      laser_cooldown: 0.5,
      invulnerable: false,
      invulnerability_time: 3,
      animation_frame: 0,
      thrusting: false
    }
  ]);

  // MOVEMENT CONTROLS
  onKeyDown("left", () => {
    player.angle -= player.turn_speed;
  });
  
  onKeyDown("right", () => {
    player.angle += player.turn_speed;
  });

  onKeyDown("up", () => {
    player.speed = Math.min(player.speed+player.acceleration, player.max_thrust);
    play("rocket_thrust", {
      // play sound
      volume: 0.1,
      speed: 2.0,
    });
  });

  onKeyDown("down", () => {
    player.speed = Math.max(player.speed-player.deceleration, -player.max_thrust);
    play("rocket_thrust", {
      volume: 0.2,
      speed: 2.0,
    });
  });

  // SHOOT CONTROLS + MECHANICS
  onKeyDown("space", () => {
    if (player.can_shoot) {
      add([
        sprite("bullet"),
        // Starting from center of the ship, add half the width in the direction given by angle
        pos(player.pos.add(pointAt(player.width/2, player.angle))),
        rotate(player.angle),
        origin("center"),
        area(),
        "bullet",
        "mobile",
        "destructs",
        {
          speed: 100
        }
      ]);
      play("laser");
      player.can_shoot = false;
      wait(player.laser_cooldown, () => {
        player.can_shoot = true;
      });
    }
  });

  // WRAP MECHANIC
  onUpdate("wraps", (e) => {
    if (e.pos.x > width()) {
        e.pos.x = 0;
    }
    if (e.pos.x < 0) {
      e.pos.x = width();
    }
    if (e.pos.y > height()) {
        e.pos.y = 0;
    }
    if (e.pos.y < 0) {
        e.pos.y = height();
    }
  });

  // COLLISION MECHANICS
  onCollide("player", "asteroid", (p, a) => {
    if (!a.initializing) {
      p.trigger("damage"); // triggers "damage" event, event is handled elsewhere in code
    }
  });

  onCollide("bullet", "asteroid", (b, a) => {
    if (!a.initializing) {
      destroy(b);
      destroy(a);
      play("explosion");
      a.is("small") ? score = score + 2 : score++;
      if (asteroidsRemaining === 0) {
        add([
          text(`YOU WIN\n\nScore: ${score}\n\nPress Q to exit.`, { size: 20}),
          pos(width()/2, height()/2),
          layer("ui")
        ]);
      }
    }
  });

  onCollide("asteroid", "asteroid", (a1, a2) => {
    if (!(a1.initializing || a2.initializing)) {
      a1.speed = -a1.speed;
      a2.speed = -a2.speed;
    }
  });

  // DAMAGE MECHANICS
  // Event handler for "damage" event!
  player.on("damage", () => {
    
    if (!player.invulnerable) {
      player.lives--;
    }
    
    if (player.lives <= 0) {
      destroy(player);
    }
    else {
      player.invulnerable = true;

      wait(player.invulnerability_time, () => {
        player.invulnerable = false;
        player.hidden = false;
      });
    }
    
  });

  // GAME OVER MECHANICS
  player.on("destroy", () => {
    add([
      text(`GAME OVER\n\nScore: ${score}\n\n[R]estart?`, { size: 20}),
      pos(width()/2, height()/2),
      layer("ui")
    ]);
  });

  onKeyPress("r", () => {
    go("main");
  });
  
  // ROCKET ANIMATIONS

  const thrust_animation = ["rocket1", "rocket2", "rocket3", "rocket4"];

  onKeyPress("up", () => {
    player.thrusting = true;
    player.animation_frame = 0
  });
  
  onKeyRelease("up", () => {
    player.thrusting = false;
  });

  onDraw("player", (p) => {
    if (player.thrusting) {
      console.log("Relative Sprite position", pointAt(p.width/2, 180 + p.angle), "angle", p.angle)
      drawSprite( {
        sprite: thrust_animation[player.animation_frame],
        pos: vec2(-p.width/2, 0), // angle happens automatically, both pos and angle are relative to the player!
        origin: "center",
      });
    }
  });

  let move_delay = 0.1;
  let timer = 0;
  onUpdate(() => {
    timer += dt();
    if (timer < move_delay) return;
    timer = 0;

    if (player.thrusting) {
      player.animation_frame++;
      if (player.animation_frame >= thrust_animation.length) {
        player.animation_frame = 0;
      }
    }

    if (player.invulnerable) {
      player.hidden = !player.hidden;
    }
  });

  // ASTEROIDS
  
  for (let i = 0; i < NUM_ASTEROIDS; i++) {
    var spawnPoint = asteroidSpawnPoint(); // choose random spawn point
    var a = add([
      sprite("asteroid"),
      pos(spawnPoint),
      rotate(rand(1,90)),
      origin("center"),
      area(),
      solid(),
      "asteroid",
      "mobile",
      "wraps",
      {
        speed: rand(5, 10),
        initializing: true
      }
    ]);
    
    while (a.isColliding("mobile")) {
      spawnPoint = asteroidSpawnPoint();
      a.pos = spawnPoint;
      a.pushOutAll();
    }

    a.initializing = false;
    
  }

  // ASTEROID SPLIT MECHANIC
  on("destroy", "asteroid", (a) => {
    asteroidsRemaining--;
    if (!a.is("small")) {
      positions = [a.pos.add(vec2(a.width/4, -a.height/4)),
                    a.pos.add(vec2(-a.width/4, -a.height/4)),
                    a.pos.add(vec2(-a.width/4, a.height/4)),
                    a.pos.add(vec2(a.width/4, a.height/4))];
      
      rotations = [16,34,65,87];

      for (let i = 0; i < positions.length; i++) {
        var s = add([
          sprite(`asteroid_small${i+1}`),
          pos(positions[i]),
          rotate(rotations[i]),
          origin("center"),
          area(),
          solid(),
          "asteroid",
          "small",
          "mobile",
          "wraps",
          {
            speed: rand(15, 25),
            initializing: false
          }
        ]);

        s.pushOutAll();
        asteroidsRemaining++;
      }
    }
    console.log(asteroidsRemaining);
  });

  function quit() {
    window.location.href="/";
  }

  onKeyPress("q", quit);

  music.loop();
}); 
// END OF MAIN SCENE

// MUSIC

const music = play("Steamtech-Mayhem_Looping");

go("main");