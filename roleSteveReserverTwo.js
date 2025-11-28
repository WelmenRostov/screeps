const creepMovement = require('./creepMovement');
let roleSteveReserverTwo = {
    run: function(creep) {
        const targetRoom = 'W21N56';

        if (creep.room.name !== targetRoom) {
            const exitDir = creep.room.findExitTo(targetRoom);
            const exit = creep.pos.findClosestByRange(creep.room.find(exitDir));
            if (exit) {
                creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffaa00' }, ignoreCreeps: true });
            }
        } else {
            const controller = creep.room.controller;
            if (controller) {
                if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }, ignoreCreeps: true });
                }
            }
        }
    }
};

module.exports = roleSteveReserverTwo;
