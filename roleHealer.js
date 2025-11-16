const creepMovement = require('./creepMovement');

let roleHealer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('💊', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.memory.guardPos) {
            let guard = creep.memory.guardPos;
            let guardRoom = guard.roomName || creep.memory.homeRoom || creep.room.name;
            if (creep.room.name !== guardRoom) {
                creepMovement.moveTo(creep, new RoomPosition(guard.x, guard.y, guardRoom), { reusePath: 15, visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }

            let guardPos = new RoomPosition(guard.x, guard.y, guardRoom);
            let wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: c => c.hits < c.hitsMax && c.pos.getRangeTo(guardPos) <= 3
            });

            if (wounded) {
                let range = creep.pos.getRangeTo(wounded);
                if (range > 1) {
                    creepMovement.moveTo(creep, wounded, { range: 1, reusePath: 2, visualizePathStyle: { stroke: '#00ff00' } });
                }
                if (range <= 1) {
                    creep.heal(wounded);
                } else if (range <= 3) {
                    creep.rangedHeal(wounded);
                }
                return;
            }

            if (!creep.pos.isEqualTo(guardPos)) {
                creepMovement.moveTo(creep, guardPos, { range: 0, reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        if (creep.memory.squadLaunched === undefined) {
            creep.memory.squadLaunched = true;
        }

        if (creep.memory.squadLaunched === false) {
            let rallyPoint = new RoomPosition(24, 46, creep.memory.homeRoom || 'W19N55');
            if (creep.pos.getRangeTo(rallyPoint) > 1) {
                creepMovement.moveTo(creep, rallyPoint, { reusePath: 10, visualizePathStyle: { stroke: '#ffff00' } });
            }
            return;
        }

        let targetRoom = creep.memory.targetRoom;
        
        if (targetRoom && creep.room.name !== targetRoom) {
            let pos = new RoomPosition(25, 25, targetRoom);
            creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#00ff00' } });
            return;
        }

        let squadId = creep.memory.squadId;
        let attackers = creep.room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'attacker' && (!squadId || c.memory.squadId === squadId)
        });

        if (attackers.length === 0) {
            if (creep.memory.targetRoom) {
                let pos = new RoomPosition(25, 25, creep.memory.targetRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        let targetAttacker = null;
        let lowestHpPercent = 1;
        
        for (let attacker of attackers) {
            let hpPercent = attacker.hits / attacker.hitsMax;
            if (hpPercent < lowestHpPercent) {
                lowestHpPercent = hpPercent;
                targetAttacker = attacker;
            }
        }

        if (!targetAttacker) {
            targetAttacker = attackers[0];
        }

        let range = creep.pos.getRangeTo(targetAttacker);

        if (targetAttacker.hits < targetAttacker.hitsMax) {
            if (range <= 1) {
                creep.heal(targetAttacker);
            } else if (range <= 3) {
                creep.rangedHeal(targetAttacker);
            }
        }

        if (range > 1) {
            creepMovement.moveTo(creep, targetAttacker, { reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
        } else {
            let adjacentHostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if (adjacentHostiles.length > 0) {
                let fleeDir = creep.pos.getDirectionTo(adjacentHostiles[0]);
                let reverseDir = (fleeDir + 3) % 8 + 1;
                creep.move(reverseDir);
            }
        }
    }
};

module.exports = roleHealer;
