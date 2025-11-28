const creepMovement = require('./creepMovement');

let roleBobReserver = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🛡️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W22N55';
        if (!targetRoom) return;

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
            return;
        }

        const controller = creep.room.controller;
        if (!controller) return;

        if (controller.my) {
            return;
        }

        const hasClaim = creep.getActiveBodyparts(CLAIM) > 0;

        if (hasClaim && !controller.owner) {
            if (creep.claimController(controller) === ERR_NOT_IN_RANGE) {
                creepMovement.moveTo(creep, controller, {
                    reusePath: 5,
                    visualizePathStyle: { stroke: '#00ffff' }
                });
            }
            return;
        }

        if (controller.owner && !controller.my) {
            if (creep.attackController(controller) === ERR_NOT_IN_RANGE) {
                creepMovement.moveTo(creep, controller, {
                    reusePath: 5,
                    visualizePathStyle: { stroke: '#ff0000' }
                });
            }
            return;
        }

        if (controller.reservation && controller.reservation.username !== creep.owner.username) {
            if (creep.attackController(controller) === ERR_NOT_IN_RANGE) {
                creepMovement.moveTo(creep, controller, {
                    reusePath: 5,
                    visualizePathStyle: { stroke: '#ff0000' }
                });
            }
            return;
        }

        if (creep.reserveController(controller) === ERR_NOT_IN_RANGE) {
            creepMovement.moveTo(creep, controller, {
                reusePath: 5,
                visualizePathStyle: { stroke: '#00ff00' }
            });
        }
    }
};

module.exports = roleBobReserver;

