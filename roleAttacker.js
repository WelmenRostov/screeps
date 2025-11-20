const creepMovement = require('./creepMovement');

module.exports = {
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;
        if (!targetRoom) return;

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20
            });
            return;
        }

        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);

        if (hostileCreeps.length > 0) {
            let target = creep.pos.findClosestByRange(hostileCreeps);

            if (target) {
                let range = creep.pos.getRangeTo(target);

                if (range <= 1) {
                    creep.attack(target);
                } else if (range <= 3) {
                    creep.rangedAttack(target);
                }

                if (range > 1) {
                    creepMovement.moveTo(creep, target, {
                        range: 1,
                        reusePath: 5
                    });
                }
            }
        } else {
            let centerPos = new RoomPosition(25, 25, targetRoom);
            creepMovement.moveTo(creep, centerPos, {
                reusePath: 10
            });
        }
    }
};

