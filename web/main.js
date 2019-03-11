"use strict";

function register_object(wasm_module, wasm_instance) {
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;

    const BLOCK_SIZE_PX = 40;

    const BOARD_WIDTH_PX = BLOCK_SIZE_PX * BOARD_WIDTH;
    const BOARD_HEIGHT_PX = BLOCK_SIZE_PX * BOARD_HEIGHT;

    const canvas = document.getElementById("the_canvas");
    canvas.width = BOARD_WIDTH_PX;
    canvas.height = BOARD_HEIGHT_PX;
    const ctx = canvas.getContext("2d");

    let game_object_address = null;
    const tick = timestamp => {
        if (game_object_address === null) {
            ctx.clearRect(0, 0, BOARD_WIDTH_PX, BOARD_HEIGHT_PX);
            draw_grid();

            game_object_address = wasm_instance.exports.Game_new(BOARD_WIDTH, BOARD_HEIGHT);
            window.addEventListener("keydown", event => { wasm_instance.exports.Game_key_handler(game_object_address, event.keyCode, 1); }, false);
            window.addEventListener("keyup", event => { wasm_instance.exports.Game_key_handler(game_object_address, event.keyCode, 0); }, false);
        }

        wasm_instance.exports.Game_tick(game_object_address, timestamp);
        requestAnimationFrame(tick);
    };

    const draw_grid = () => {
        ctx.beginPath();

        ctx.strokeStyle = "#004040";
        ctx.lineWidth = 2.0;

        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.moveTo(x * BLOCK_SIZE_PX, 0);
            ctx.lineTo(x * BLOCK_SIZE_PX, BOARD_HEIGHT_PX - 1);
        }

        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.moveTo(0, y * BLOCK_SIZE_PX);
            ctx.lineTo(BOARD_WIDTH_PX - 1, y * BLOCK_SIZE_PX);
        }

        ctx.stroke();
    };

    const draw_block = (x, y, color) => {
        const color_hex = "#" + color.toString(16).padStart(6, "0");

        const cx = x * BLOCK_SIZE_PX + 1;
        const cy = y * BLOCK_SIZE_PX + 1;
        const cw = BLOCK_SIZE_PX - 2;
        const ch = BLOCK_SIZE_PX - 2;

        ctx.fillStyle = color_hex;
        ctx.fillRect(cx, cy, cw, ch);
    };

    const console_log = (address, length) => {
        const buffer = new Uint8Array(wasm_instance.exports.memory.buffer, address, length);
        const s = new TextDecoder().decode(buffer);
        console.log(s);
    };

    requestAnimationFrame(tick);

    return {
        console_log: console_log,
        draw_block: draw_block,
    };
}

function main() {
    let shims = null;
    const importObject = {
        env: {
            console_log: function () { shims.console_log.apply(this, arguments); },
            draw_block: function () { shims.draw_block.apply(this, arguments); },
        }
    };

    fetch("rstetris.wasm")
        .then(response => WebAssembly.instantiateStreaming(response, importObject))
        .then(result => {
            shims = register_object(result.module, result.instance);
        })
        .catch(error => console.log("Error loading WASM module: " + error));
}

main();
