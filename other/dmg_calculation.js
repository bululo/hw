let target = {id: null, level: 0, size: 0, race: 0, property: 0, mdef: 0, int: 0, type: 0};
let stats = {baseLv: null, jobLv: null, str: null, agi: null, vit: null, int: null, dex: null, luk: null};
let equipStats = {
    str: null,
    agi: null,
    vit: null,
    int: null,
    dex: null,
    luk: null,
    flatMATK: null,
    flatFCT: null,
    percentFCT: null,
    VCT: null,
    castdelay: null,
    flatASPD: null,
    percentASPD: null,
    bypass: null
};
let refinement = {top: null, armor: null, weapon: null, shield: null, garment: null, shoes: null};
let s_refinement = {armor: null, weapon: null, shield: null, shoes: null, earring: null, necklace: null};
let weapon = {baseMATK: null, lv: null, upgradeBonus: null};
let currentEquip = null;
let skill = {
    name: null,
    id: null,
    dmg: null,
    property: null,
    hits: null,
    cooldown: null,
    fct: null,
    vct: null,
    castdelay: null
};
let multipliers = {
    matk: null,
    race: null,
    size: null,
    property: null,
    monster: null,
    skill_property: null,
    protocol: null,
    skill: null
};

function damage_calculation() {
    // Zera os multiplicadores
    init();
    // Recupera a informação sobre o alvo
    updateTarget();
    // Aplica os Bonus dos Equipamentos
    retrieveEquipBonus();
    // Seta os status na tela
    let span = document.getElementsByTagName("span");
    span[2].innerText = ' + ' + equipStats.str;
    span[3].innerText = ' + ' + equipStats.agi;
    span[4].innerText = ' + ' + equipStats.vit;
    span[5].innerText = ' + ' + equipStats.int;
    span[6].innerText = ' + ' + equipStats.dex;
    span[7].innerText = ' + ' + equipStats.luk;
    //alert('Castdelay: ' + equipStats.castdelay);
    // Calcula a variação do ATQM
    let variance = weaponMATKvariance();
    let over = overUpgradeBonus();
    // Soma os ATQMs
    let int = stats.int + equipStats.int;
    let dex = stats.dex + equipStats.dex;
    let luk = stats.luk + equipStats.luk;
    let statMATK = Math.floor(Math.floor(stats.baseLv / 4) + int + Math.floor(int / 2) + Math.floor(dex / 5) + Math.floor(luk / 3));
    let MATK = statMATK + equipStats.flatMATK + weapon.baseMATK + weapon.upgradeBonus;

    // Calcula o ATQM máximo e mínimo brutos
    let minMATK = MATK - variance;
    let maxMATK = MATK + variance + over;
    // Aplica os Multiplicadores
    console.log('StatMATK' + statMATK);
    console.log('EquipMATK: ' + (MATK - statMATK));
    // ATQM Mínimo
    minMATK = Math.floor(minMATK * (multipliers.matk) / 100);
    minMATK = Math.floor(minMATK * (multipliers.race[ALL] + multipliers.race[target.race]) / 100);
    minMATK = Math.floor(minMATK * (multipliers.property[ALL] + multipliers.property[target.property[0]]) / 100);
    minMATK = Math.floor(minMATK * (multipliers.size[ALL] + multipliers.size[target.size]) / 100);
    minMATK = Math.floor(minMATK * (multipliers.monster) / 100);
    minMATK = Math.floor(minMATK * (multipliers.skill_property[ALL] + multipliers.skill_property[skill.property]) / 100);
    minMATK = Math.floor(minMATK * (multipliers.protocol[ALL] + multipliers.protocol[target.type]) / 100);
    // ATQM Máximo
    maxMATK = Math.floor(maxMATK * (multipliers.matk) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.race[ALL] + multipliers.race[target.race]) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.property[ALL] + multipliers.property[target.property[0]]) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.size[ALL] + multipliers.size[target.size]) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.monster) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.skill_property[ALL] + multipliers.skill_property[skill.property]) / 100);
    maxMATK = Math.floor(maxMATK * (multipliers.protocol[ALL] + multipliers.protocol[target.type]) / 100);
    // Calculo de Fraqueza e Resistência
    let softMDEF = Math.floor(((target.level / 4) + (target.int / 4)));
    if (equipStats.bypass > 100)
        equipStats.bypass = 100;
    let hardMDEF = target.mdef - Math.floor(equipStats.bypass * target.mdef / 100); // Calculate pierce here
    hardMDEF = (1000 + hardMDEF) / (1000 + (hardMDEF * 10));
    let weakness = 100;
    weakness = properties[target.property[1] - 1][target.property[0] - 1];
    //alert('Property:'+target.property[0]+' Property level:'+target.property[1]+' Weakness'+weakness);
    // Calculo do Dano da Habilidade
    minMATK = Math.floor(Math.floor((Math.floor((Math.floor(minMATK * skill.dmg) * hardMDEF - softMDEF) * (multipliers.skill) / 100) * weakness) / 100) / skill.hits) * skill.hits;
    maxMATK = Math.floor(Math.floor((Math.floor((Math.floor(maxMATK * skill.dmg) * hardMDEF - softMDEF) * (multipliers.skill) / 100) * weakness) / 100) / skill.hits) * skill.hits;
    // Atualização do Resultado
    if (minMATK === maxMATK) {
        document.getElementById("finalSkillDamage").value = minMATK;
    } else {
        document.getElementById("finalSkillDamage").value = minMATK + '~' + maxMATK;
    }
}

function init() {
    // Zera os multiplicadores
    multipliers.matk = 100;
    multipliers.race = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    multipliers.size = [100, 0, 0, 0];
    multipliers.property = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    multipliers.monster = 100;
    multipliers.skill_property = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    multipliers.protocol = [100, 0, 0, 0];
    multipliers.skill = 100;
    // Recupera os atributos do personagem
    stats.baseLv = parseInt(document.getElementById("base_lvl").value);
    stats.jobLv = parseInt(document.getElementById("job_lvl").value);
    stats.str = parseInt(document.getElementById("base_str").value);
    stats.agi = parseInt(document.getElementById("base_agi").value);
    stats.vit = parseInt(document.getElementById("base_vit").value);
    stats.int = parseInt(document.getElementById("base_int").value);
    stats.dex = parseInt(document.getElementById("base_dex").value);
    stats.luk = parseInt(document.getElementById("base_luk").value);
    // Zera os bonus de equipamentos
    equipStats.str = 0;
    equipStats.agi = 0;
    equipStats.vit = 0;
    equipStats.int = 0;
    equipStats.dex = 0;
    equipStats.luk = 0;
    equipStats.flatMATK = 0;
    equipStats.flatFCT = 0;
    equipStats.percentFCT = 0;
    equipStats.VCT = 0;
    equipStats.castdelay = 0;
    equipStats.flatASPD = 0;
    equipStats.percentASPD = 0;
    equipStats.bypass = 0;
    // Recupera os bonus de job
    let jobStatBonus = ArchBishop.find((line) => line.level === stats.jobLv);
    equipStats.str += jobStatBonus.bonus[0];
    equipStats.agi += jobStatBonus.bonus[1];
    equipStats.vit += jobStatBonus.bonus[2];
    equipStats.int += jobStatBonus.bonus[3];
    equipStats.dex += jobStatBonus.bonus[4];
    equipStats.luk += jobStatBonus.bonus[5];
    //
    weapon.baseMATK = 0;
    weapon.lv = 0;
    weapon.upgradeBonus = 0;
    // Seta a skill a ser calculada
    let selectedSkill = skills.find((line) => line.id === document.getElementById('skill').value);
    skill.name = selectedSkill.name;
    skill.id = selectedSkill.id;
    skill.dmg = selectedSkill.script();
    skill.property = selectedSkill.property;
    skill.hits = selectedSkill.hits;
    skill.cooldown = selectedSkill.cooldown;
    skill.fct = selectedSkill.fct;
    skill.vct = selectedSkill.vct;
    skill.castdelay = selectedSkill.castdelay;
}

function updateTarget() {
    target.id = document.getElementById('target_name').value;
    target.level = parseInt(document.getElementById('target_level').value);
    target.type = document.getElementById('target_type').selectedIndex + 1;

    target.race = document.getElementById('target_race').value;
    target.property = [document.getElementById('target_property').value, document.getElementById('target_property_level').selectedIndex + 1];
    target.size = parseInt(document.getElementById('target_size').selectedIndex) + 1;

    target.mdef = parseInt(document.getElementById('target_mdef').value);
    target.int = parseInt(document.getElementById('target_int').value);
}

function retrieveRefinements() {
    refinement.top = document.getElementById('top_refine').options.selectedIndex.valueOf();
    refinement.armor = document.getElementById("arm_refine").options.selectedIndex.valueOf();
    refinement.weapon = document.getElementById("wea_refine").options.selectedIndex.valueOf();
    refinement.shield = document.getElementById("shi_refine").options.selectedIndex.valueOf();
    refinement.garment = document.getElementById("gar_refine").options.selectedIndex.valueOf();
    refinement.shoes = document.getElementById("sho_refine").options.selectedIndex.valueOf();

    s_refinement.armor = document.getElementById('s_arm_refine').options.selectedIndex.valueOf();
    s_refinement.weapon = document.getElementById('s_wea_refine').options.selectedIndex.valueOf();
    s_refinement.shield = document.getElementById('s_shi_refine').options.selectedIndex.valueOf();
    s_refinement.shoes = document.getElementById('s_sho_refine').options.selectedIndex.valueOf();
    s_refinement.earring = document.getElementById('s_ear_refine').options.selectedIndex.valueOf();
    s_refinement.necklace = document.getElementById('s_nec_refine').options.selectedIndex.valueOf();
}

function retrieveEquipBonus() {
    retrieveRefinements();
    const equipsArray = ['top', 'mid', 'low', 'arm', 'wea', 'shi', 'gar', 'sho', 'ac1', 'ac2', 'c_top', 'c_mid', 'c_low', 's_arm', 's_wea', 's_shi', 'c_gar', 's_sho', 's_ear', 's_nec'];
    equipsArray.forEach(equip => {
        //alert("Posição: "+equip);
        currentEquip = equip;
        let select = document.getElementById(equip);
        let id = select.options[select.selectedIndex].value;
        if (id !== '') {
            let searchObject = returnArray(equip).find((item) => item.id === select.value);
            searchObject.script();
            //alert(equipStats.flatMATK);

            // For each of the 4 possible slots
            retrieveSlot(1, searchObject.slot1, equip);
            retrieveSlot(2, searchObject.slot2, equip);
            retrieveSlot(3, searchObject.slot3, equip);
            retrieveSlot(4, searchObject.slot4, equip);
            //alert('rodou com sucesso todos os slots do '+equip);
        }
    });
}

function retrieveSlot(i, text, equip) {
    let slot = document.getElementById(equip + '_slot' + i);
    if (text === "card") {
        let searchObject = cards.find((card) => card.id === slot.options[slot.selectedIndex].value);
        if (searchObject != null)
            searchObject.script();
    } else if (text !== undefined && text !== null) {
        let a = document.getElementById(equip + '_slot' + i)
        let searchObject = enchants.find((enchant) => enchant.id === a.options[a.selectedIndex].value);
        if (searchObject != null)
            searchObject.script();
    }
}

function returnArray(array) {
    switch (array) {
        // Equipamentos
        case 'top':
            return tops;
        case 'mid':
            return mid;
        case 'low':
            return low;
        case 'arm':
            return armors;
        case 'wea':
            return weapons;
        case 'shi':
            return shields;
        case 'gar':
            return garments;
        case 'sho':
            return shoes;
        case 'ac1':
            return accessory;
        case 'ac2':
            return accessory;
        // Encantamentos Visuais
        case 'c_top':
            return c_top;
        case 'c_mid':
            return c_mid;
        case 'c_low':
            return c_low;
        case 'c_gar':
            return c_gar;
        // Equipamentos Sombrios
        case 's_arm':
            return s_armor;
        case 's_wea':
            return s_weapon;
        case 's_shi':
            return s_shield;
        case 's_sho':
            return s_shoes;
        case 's_ear':
            return s_earring;
        case 's_nec':
            return s_necklace;
    }
}

function weaponMATKvariance() {
    let weaponLevel = weapon.lv;
    let baseWeaponDamage = weapon.baseMATK;
    let weaponUpgrade = refinement.weapon;
    let refinementBonus = 0;
    if (weaponLevel === 4) {
        refinementBonus = 7 * weaponUpgrade;
    } else if (weaponLevel === 3) {
        refinementBonus = 5 * weaponUpgrade;
    } else if (weaponLevel === 2) {
        refinementBonus = 3 * weaponUpgrade;
    } else if (weaponLevel === 2) {
        refinementBonus = 2 * weaponUpgrade;
    }
    weapon.upgradeBonus = refinementBonus;
    return Math.floor((weaponLevel) * (baseWeaponDamage + refinementBonus) / 10);
}

function overUpgradeBonus() {
    let weaponLevel = weapon.lv;
    let weaponUpgrade = refinement.weapon;
    let over = 0;
    if (weaponLevel === 4 && weaponUpgrade >= 5) {
        over = (weaponUpgrade - 4) * 14;
    } else if (weaponLevel === 3 && weaponUpgrade >= 6) {
        over = (weaponUpgrade - 5) * 8;
    } else if (weaponLevel === 2 && weaponUpgrade >= 7) {
        over = (weaponUpgrade - 6) * 5;
    } else if (weaponLevel === 1 && weaponUpgrade >= 8) {
        over = (weaponUpgrade - 7) * 2;
    }
    return over;
}
