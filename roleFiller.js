const creepMovement = require('./creepMovement');

let roleFiller = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🛢️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let sourceRoom = creep.memory.sourceRoom;
        let targetRoom = creep.memory.targetRoom;

        if (!sourceRoom || !targetRoom) {
            return;
        }

        if (creep.store[RESOURCE_POWER] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            if (creep.room.name !== targetRoom) {
                let pos = new RoomPosition(25, 25, targetRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }

            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE
            })[0];

            if (storage) {
                if (creep.transfer(storage, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, { reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
                }
            }
        } else {
            if (creep.room.name !== sourceRoom) {
                let pos = new RoomPosition(25, 25, sourceRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            let power = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_POWER
            });

            if (power) {
                if (creep.pickup(power) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, power, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
                filter: (t) => t.store[RESOURCE_POWER] > 0
            });

            if (tombstone) {
                if (creep.withdraw(tombstone, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, tombstone, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let ruin = creep.pos.findClosestByPath(FIND_RUINS, {
                filter: (r) => r.store && r.store[RESOURCE_POWER] > 0
            });

            if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, ruin, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        }
    }
};

module.exports = roleFiller;


