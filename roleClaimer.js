const creepMovement = require('./creepMovement');

let roleClaimer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🏴', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom;
        if (!targetRoom) return;

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), { 
                reusePath: 10,
                visualizePathStyle: { stroke: '#ff00ff' } 
            });
            return;
        }

        const controller = creep.room.controller;
        if (!controller) return;

        let range = creep.pos.getRangeTo(controller);
        
        if (range <= 1) {
            if (!controller.my) {
                let result = creep.claimController(controller);
                if (result === ERR_GCL_NOT_ENOUGH || result === ERR_INVALID_TARGET) {
                    result = creep.reserveController(controller);
                }
                if (result !== OK && result !== ERR_BUSY && result !== ERR_NOT_IN_RANGE) {
                    creep.say('Err: ' + result);
                }
            }
        } else {
            creepMovement.moveTo(creep, controller, { 
                reusePath: 10,
                visualizePathStyle: { stroke: '#ff00ff' } 
            });
        }
    }
};

module.exports = roleClaimer;
