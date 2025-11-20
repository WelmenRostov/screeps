const creepMovement = require('./creepMovement');

let roleMammyHealer = {
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W24N56';

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(27, 30, targetRoom), {
                reusePath: 20
            });
            return;
        }

        let damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
            filter: c => c.hits < c.hitsMax && c !== creep
        });

        if (damagedCreeps.length === 0) {
            let centerPos = new RoomPosition(27, 30, targetRoom);
            if (creep.pos.getRangeTo(centerPos) > 0) {
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10,
                    range: 0
                });
            }
            return;
        }

        let target = creep.pos.findClosestByRange(damagedCreeps);

        if (target) {
            let range = creep.pos.getRangeTo(target);
            
            if (range <= 1) {
                if (target.hits < target.hitsMax) {
                    creep.heal(target);
                }
            } else if (range <= 3) {
                if (target.hits < target.hitsMax) {
                    creep.rangedHeal(target);
                }
            }
            
            if (range > 1) {
                creepMovement.moveTo(creep, target, {
                    range: 1,
                    reusePath: 5
                });
            }
        }
    }
};

module.exports = roleMammyHealer;

