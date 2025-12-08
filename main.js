// main.js — единственный loop
const mainLeg = require('mainLeg');    // Старый main
const mainBase = require('main.base'); // Новый main

module.exports.loop = function() {
    // Вызываем новый main.base
    if (mainBase && typeof mainBase.run === 'function') {
        mainBase.run();  // тут будет commit-маркер, если заработает
    }

    // Вызываем старый mainLeg
    if (mainLeg && typeof mainLeg.loop === 'function') {
        mainLeg.loop();
    }
};
