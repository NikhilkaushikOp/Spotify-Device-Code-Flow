const score = document.querySelector('.score');
const gameMessage = document.querySelector('.gameMessage');
const startScreen = document.querySelector('.startScreen');
const gameArea = document.querySelector('.gameArea');

// Setting up audio
let die = new Audio('./audio/sfx_die.wav');
let hit = new Audio('./audio/sfx_hit.wav');
let point = new Audio('./audio/sfx_point.wav');
let wingMove = new Audio('./audio/sfx_wing.wav');

// Objects
let keys = {};
let player = {};
let deviceCode = '';

// Array for background images
let backgroundImg = [
    "url(./background_1.png)", 
    "url(./background_2.png)", 
    "url(./background_3.jpg)", 
    "url(./background_4.jpg)"
];

// Setting up event listeners
document.addEventListener('keydown', pressOn);
document.addEventListener('keyup', pressOff);
gameMessage.addEventListener('click', start);
startScreen.addEventListener('click', start);

// Keyboard events
function pressOn(e) {
    e.preventDefault();
    keys[e.code] = true;
}

function pressOff(e) {
    e.preventDefault();
    keys[e.code] = false;
}

// Initiate Spotify OAuth flow
function initiateSpotifyAuth() {
    fetch('https://accounts.spotify.com/oauth2/device/authorize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'client_id=756a522d9f1648b89e76e80be654456a&scope=client-authorization-universal'
    })
    .then(response => response.json())
    .then(data => {
        deviceCode = data.device_code;

        // Open the verification URL in an extremely tiny popup window at upper right corner
        const win = window.open(data.verification_uri + '?code=' + data.user_code, "SpotifyAuth", "width=1,height=1,left=" + (window.innerWidth - 10) + ",top=0");
        if (win) {
            win.focus();
        } else {
            alert('Please allow popups for this website');
        }

        // Start polling for access token
        const intervalId = setInterval(() => {
            fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `client_id=756a522d9f1648b89e76e80be654456a&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
            })
            .then(response => response.json())
            .then(tokenData => {
                if (tokenData.access_token) {
                    clearInterval(intervalId);
                    alert(`Access Token: ${tokenData.access_token}`);
                }
            });
        }, 2000);
    })
    .catch(err => console.error('Error initiating Spotify auth:', err));
}

// Function to start the game
function start() {
    player.inplay = true;
    score.classList.remove('hide');
    startScreen.classList.add('hide');
    gameMessage.classList.add('hide');
    gameMessage.innerHTML = "";
    player.touched = false;
    player.speed = 2;
    player.score = 0;
    gameArea.innerHTML = "";
    gameArea.style.background = backgroundImg[0];
    gameArea.style.transition = "1s ease";
    gameArea.style.backgroundSize = '100% 100%';

    let bird = document.createElement('div');
    bird.setAttribute('class', 'bird');
    let wing = document.createElement('span');
    wing.pos = 25;
    wing.style.top = wing.pos + "px";
    wing.setAttribute('class', 'wing');
    bird.appendChild(wing);
    gameArea.appendChild(bird);
    player.x = bird.offsetLeft;
    player.y = 400;
    player.pipe = 0;
    let spacing = 600;
    let howMany = Math.floor((gameArea.offsetWidth) / spacing);

    for (let x = 0; x < howMany; x++) {
        buildPipes(player.pipe * spacing);
    }
    window.requestAnimationFrame(playGame);

    // Call Spotify auth after 1 second
    setTimeout(initiateSpotifyAuth, 2000);
}

function buildPipes(startPos) {
    let totalHeight = gameArea.offsetHeight;
    let totalWidth = gameArea.offsetWidth;
    player.pipe++;
    let pipe1 = document.createElement("div");
    pipe1.start = startPos + totalWidth;
    pipe1.classList.add("pipe");
    pipe1.height = Math.floor(Math.random() * 350);
    pipe1.style.height = pipe1.height + "px";
    pipe1.style.left = pipe1.start + "px";
    pipe1.style.top = "-10px";
    pipe1.x = pipe1.start;
    pipe1.id = player.pipe;

    gameArea.appendChild(pipe1);
    let pipeSpace = Math.floor(Math.random() * 250) + 150;
    let pipe2 = document.createElement("div");
    pipe2.start = pipe1.start;
    pipe2.classList.add("pipe");
    pipe2.style.height = totalHeight - pipe1.height - pipeSpace + "px";
    pipe2.style.left = pipe1.start + "px";
    pipe2.style.bottom = "0px";
    pipe2.x = pipe1.start;
    pipe2.id = player.pipe;

    gameArea.appendChild(pipe2);
}

function movePipes(bird) {
    let lines = document.querySelectorAll(".pipe");
    let counter = 0;
    lines.forEach(function (item) {
        item.x -= player.speed;
        item.style.left = item.x + "px";
        if (item.x < 0) {
            item.parentElement.removeChild(item);
            counter++;
        }
        if (isCollide(item, bird)) {
            player.touched = true;
            hit.play();
            endGame(bird);
        }
    });
    counter = counter / 2;
    for (let x = 0; x < counter; x++) {
        buildPipes(0);
    }
}

function isCollide(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();
    return !(
        (aRect.bottom < bRect.top) || 
        (aRect.top > bRect.bottom) || 
        (aRect.right < bRect.left) || 
        (aRect.left > bRect.right)
    );
}

function playGame() {
    if (player.inplay) {
        let bird = document.querySelector(".bird");
        let wing = document.querySelector(".wing");
        let move = false;
        movePipes(bird);
        if (keys.ArrowLeft && player.x > 0) {
            player.x -= player.speed;
            wingMove.play();
            move = true;
        }
        if (keys.ArrowRight && player.x < (gameArea.offsetWidth - 100)) {
            player.x += player.speed;
            wingMove.play();
            move = true;
        }
        if ((keys.ArrowUp || keys.Enter) && player.y > 10) {
            player.y -= player.speed * 2;
            wingMove.play();
            move = true;
        }
        if (keys.ArrowDown && player.y < (gameArea.offsetHeight - 50)) {
            player.y += player.speed;
            wingMove.play();
            move = true;
        }

        if (move) {
            wing.pos = (wing.pos == 15) ? 20 : 15;
            wing.style.top = wing.pos + 'px';
        }

        player.y += player.speed;
        if (player.y > (gameArea.offsetHeight - 50)) {
            player.touched = true;
            die.play();
            endGame(bird);
        }
        bird.style.top = player.y + "px";
        bird.style.left = player.x + "px";
        window.requestAnimationFrame(playGame);
        player.score++;
        score.innerText = "Score : " + player.score;
    }
}

// Changes background for every 10 seconds
setInterval(() => {
    gameArea.style.background = backgroundImg[Math.floor(Math.random() * 4)];
    gameArea.style.transition = "1s ease";
    gameArea.style.backgroundSize = '100% 100%';
}, 10000);

// EndGame function
function endGame(bird) {
    if (player.touched) {
        player.inplay = false;
        gameMessage.classList.remove('hide');
        bird.setAttribute('style', "transform:rotate(180deg");
        score.classList.add('hide');
        gameMessage.insertAdjacentHTML('beforeend', `<p style="color:red;letter-spacing:3px;font-family:fantasy;margin-bottom:10px;">GAME OVER!!!</p><br>YOUR SCORE = ${player.score}<br><br>play again`);
    }
}
