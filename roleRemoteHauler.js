const creepMovement = require('./creepMovement');

let roleRemoteHauler = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('📦', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const homeLinkPos = creep.memory.homeLinkPos;
        if (!homeLinkPos) return;

        const bobSpawn = Game.spawns['Bob'];
        if (!bobSpawn || !bobSpawn.room || !bobSpawn.room.storage) {
            return;
        }

        const bobStorage = bobSpawn.room.storage;
        const mammySpawn = Game.spawns['Mammy'];
        if (!mammySpawn || !mammySpawn.room || !mammySpawn.room.storage) {
            return;
        }

        const mammyStorage = mammySpawn.room.storage;
        const homeLink = new RoomPosition(homeLinkPos.x, homeLinkPos.y, homeLinkPos.roomName)
            .lookFor(LOOK_STRUCTURES)
            .find(s => s.structureType === STRUCTURE_LINK);

        const isFull = creep.store.getFreeCapacity() === 0;
        const hasNonEnergy = Object.keys(creep.store).some(res => res !== RESOURCE_ENERGY && creep.store[res] > 0);
        const hasEnergy = creep.store[RESOURCE_ENERGY] > 0;

        if (!isFull && !hasNonEnergy) {
            if (creep.room.name !== bobStorage.room.name) {
                creepMovement.moveTo(creep, bobStorage.pos, { reusePath: 15, visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            let resourceType = null;
            let resourceAmount = 0;

            for (let res in bobStorage.store) {
                if (res !== RESOURCE_ENERGY && bobStorage.store[res] > 0) {
                    resourceType = res;
                    resourceAmount = bobStorage.store[res];
                    break;
                }
            }

            if (!resourceType && bobStorage.store[RESOURCE_ENERGY] > 0) {
                resourceType = RESOURCE_ENERGY;
                resourceAmount = bobStorage.store[RESOURCE_ENERGY];
            }

            if (resourceType && resourceAmount > 0) {
                if (creep.withdraw(bobStorage, resourceType) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, bobStorage, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        } else {
            if (hasNonEnergy) {
                if (creep.room.name !== mammyStorage.room.name) {
                    creepMovement.moveTo(creep, mammyStorage.pos, { reusePath: 15, visualizePathStyle: { stroke: '#ffffff' } });
                    return;
                }

                if (creep.pos.getRangeTo(mammyStorage) > 1) {
                    creepMovement.moveTo(creep, mammyStorage, { reusePath: 5, visualizePathStyle: { stroke: '#ffffff' } });
                    return;
                }

                for (let res in creep.store) {
                    if (creep.store[res] > 0) {
                        creep.transfer(mammyStorage, res);
                    }
                }
                return;
            } else {
                if (creep.room.name !== homeLinkPos.roomName) {
                    creepMovement.moveTo(creep, new RoomPosition(homeLinkPos.x, homeLinkPos.y, homeLinkPos.roomName), { reusePath: 15, visualizePathStyle: { stroke: '#ffffff' } });
                    return;
                }

                if (homeLink && creep.store[RESOURCE_ENERGY] > 0 && homeLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    if (creep.transfer(homeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, homeLink, { reusePath: 5, visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    return;
                }
            }
        }
    }
};

module.exports = roleRemoteHauler;


