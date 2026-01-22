/**
 * Exercise Data Module
 * Contains all exercise data for different body parts
 */

const ExerciseData = {
    // Body part definitions with exercises
    bodyParts: {
        chest: {
            id: 'chest',
            name: '胸部',
            nameEn: 'Chest',
            icon: '🏋️',
            exercises: [
                {
                    id: 'bench-press',
                    name: '杠铃卧推',
                    nameEn: 'Bench Press',
                    icon: '🏋️',
                    description: '经典的胸部训练动作，主要锻炼胸大肌中部',
                    muscles: ['胸大肌', '三角肌前束', '肱三头肌'],
                    tips: ['保持肩胛骨收紧', '控制下放速度', '呼吸配合动作']
                },
                {
                    id: 'incline-press',
                    name: '上斜卧推',
                    nameEn: 'Incline Press',
                    icon: '🔺',
                    description: '针对上胸部的卧推变式',
                    muscles: ['胸大肌上部', '三角肌前束'],
                    tips: ['角度30-45度最佳', '感受上胸发力']
                },
                {
                    id: 'dumbbell-fly',
                    name: '哑铃飞鸟',
                    nameEn: 'Dumbbell Fly',
                    icon: '🦅',
                    description: '孤立胸大肌的拉伸动作',
                    muscles: ['胸大肌'],
                    tips: ['微屈手肘', '控制幅度', '感受胸肌拉伸']
                },
                {
                    id: 'push-up',
                    name: '俯卧撑',
                    nameEn: 'Push Up',
                    icon: '💪',
                    description: '自重训练的经典动作',
                    muscles: ['胸大肌', '三角肌', '肱三头肌'],
                    tips: ['身体保持一条直线', '手掌略宽于肩']
                },
                {
                    id: 'cable-crossover',
                    name: '龙门架夹胸',
                    nameEn: 'Cable Crossover',
                    icon: '🔗',
                    description: '绳索训练，持续张力刺激胸肌',
                    muscles: ['胸大肌内侧'],
                    tips: ['保持核心稳定', '在顶峰位挤压']
                },
                {
                    id: 'decline-press',
                    name: '下斜卧推',
                    nameEn: 'Decline Press',
                    icon: '🔻',
                    description: '针对下胸部的训练动作',
                    muscles: ['胸大肌下部'],
                    tips: ['注意安全', '控制重量']
                }
            ]
        },
        shoulder: {
            id: 'shoulder',
            name: '肩部',
            nameEn: 'Shoulder',
            icon: '🤸',
            exercises: [
                {
                    id: 'overhead-press',
                    name: '杠铃推举',
                    nameEn: 'Overhead Press',
                    icon: '⬆️',
                    description: '肩部训练的王牌动作',
                    muscles: ['三角肌前束', '三角肌中束', '肱三头肌'],
                    tips: ['核心收紧', '不要过度后仰', '全程控制']
                },
                {
                    id: 'lateral-raise',
                    name: '哑铃侧平举',
                    nameEn: 'Lateral Raise',
                    icon: '↔️',
                    description: '孤立训练三角肌中束',
                    muscles: ['三角肌中束'],
                    tips: ['小臂微屈', '肩部发力', '控制速度']
                },
                {
                    id: 'front-raise',
                    name: '前平举',
                    nameEn: 'Front Raise',
                    icon: '⬆️',
                    description: '针对三角肌前束的孤立动作',
                    muscles: ['三角肌前束'],
                    tips: ['避免借力', '不要超过眼睛高度']
                },
                {
                    id: 'rear-delt-fly',
                    name: '俯身飞鸟',
                    nameEn: 'Rear Delt Fly',
                    icon: '🦋',
                    description: '针对三角肌后束的训练',
                    muscles: ['三角肌后束'],
                    tips: ['俯身角度保持', '感受后束收缩']
                },
                {
                    id: 'arnold-press',
                    name: '阿诺德推举',
                    nameEn: 'Arnold Press',
                    icon: '💪',
                    description: '全面刺激三角肌的复合动作',
                    muscles: ['三角肌前束', '三角肌中束'],
                    tips: ['旋转过程平滑', '不要完全锁死']
                },
                {
                    id: 'face-pull',
                    name: '面拉',
                    nameEn: 'Face Pull',
                    icon: '🎯',
                    description: '改善肩部健康的训练动作',
                    muscles: ['三角肌后束', '斜方肌'],
                    tips: ['外旋手臂', '挤压肩胛骨']
                }
            ]
        },
        back: {
            id: 'back',
            name: '背部',
            nameEn: 'Back',
            icon: '🧗',
            exercises: [
                {
                    id: 'pull-up',
                    name: '引体向上',
                    nameEn: 'Pull Up',
                    icon: '🧗',
                    description: '背部训练的黄金动作',
                    muscles: ['背阔肌', '肱二头肌', '菱形肌'],
                    tips: ['肩胛骨下沉', '挺胸', '控制下放']
                },
                {
                    id: 'barbell-row',
                    name: '杠铃划船',
                    nameEn: 'Barbell Row',
                    icon: '🚣',
                    description: '增加背部厚度的复合动作',
                    muscles: ['背阔肌', '菱形肌', '斜方肌'],
                    tips: ['腰背挺直', '拉向腹部', '挤压背部']
                },
                {
                    id: 'lat-pulldown',
                    name: '高位下拉',
                    nameEn: 'Lat Pulldown',
                    icon: '⬇️',
                    description: '引体向上的替代动作',
                    muscles: ['背阔肌'],
                    tips: ['挺胸', '肩胛骨下沉后移', '感受背阔肌发力']
                },
                {
                    id: 'seated-row',
                    name: '坐姿划船',
                    nameEn: 'Seated Row',
                    icon: '🪑',
                    description: '背部中部的训练动作',
                    muscles: ['菱形肌', '斜方肌中部', '背阔肌'],
                    tips: ['身体不要过度前后摆动', '挤压肩胛骨']
                },
                {
                    id: 'dumbbell-row',
                    name: '单臂哑铃划船',
                    nameEn: 'Dumbbell Row',
                    icon: '💪',
                    description: '单侧背部训练，纠正不平衡',
                    muscles: ['背阔肌', '菱形肌'],
                    tips: ['稳定支撑腿', '拉向髋部', '旋转躯干']
                },
                {
                    id: 'deadlift',
                    name: '硬拉',
                    nameEn: 'Deadlift',
                    icon: '🏋️',
                    description: '全身性训练动作，强化后链',
                    muscles: ['竖脊肌', '臀大肌', '腘绳肌'],
                    tips: ['腰背挺直', '杠铃贴身', '臀部夹紧']
                }
            ]
        },
        legs: {
            id: 'legs',
            name: '腿部',
            nameEn: 'Legs',
            icon: '🦵',
            exercises: [
                {
                    id: 'squat',
                    name: '深蹲',
                    nameEn: 'Squat',
                    icon: '🏋️',
                    description: '训练之王，全面刺激下肢',
                    muscles: ['股四头肌', '臀大肌', '腘绳肌'],
                    tips: ['膝盖与脚尖同向', '蹲到平行或以下', '核心收紧']
                },
                {
                    id: 'leg-press',
                    name: '腿举',
                    nameEn: 'Leg Press',
                    icon: '🦵',
                    description: '安全高效的腿部训练',
                    muscles: ['股四头肌', '臀大肌'],
                    tips: ['不要锁死膝盖', '下放充分', '控制重量']
                },
                {
                    id: 'leg-extension',
                    name: '腿屈伸',
                    nameEn: 'Leg Extension',
                    icon: '🔄',
                    description: '孤立股四头肌的训练',
                    muscles: ['股四头肌'],
                    tips: ['顶峰收缩', '控制速度', '不要用爆发力']
                },
                {
                    id: 'leg-curl',
                    name: '腿弯举',
                    nameEn: 'Leg Curl',
                    icon: '🔃',
                    description: '针对腘绳肌的训练',
                    muscles: ['腘绳肌'],
                    tips: ['全程控制', '顶峰挤压', '避免借力']
                },
                {
                    id: 'lunge',
                    name: '箭步蹲',
                    nameEn: 'Lunge',
                    icon: '🚶',
                    description: '单腿训练，提升稳定性',
                    muscles: ['股四头肌', '臀大肌'],
                    tips: ['前膝不超过脚尖', '躯干保持直立']
                },
                {
                    id: 'calf-raise',
                    name: '提踵',
                    nameEn: 'Calf Raise',
                    icon: '🦶',
                    description: '小腿训练动作',
                    muscles: ['腓肠肌', '比目鱼肌'],
                    tips: ['全程幅度', '顶峰停顿', '慢速下放']
                }
            ]
        },
        arms: {
            id: 'arms',
            name: '手臂',
            nameEn: 'Arms',
            icon: '💪',
            exercises: [
                {
                    id: 'barbell-curl',
                    name: '杠铃弯举',
                    nameEn: 'Barbell Curl',
                    icon: '💪',
                    description: '二头肌训练的基础动作',
                    muscles: ['肱二头肌'],
                    tips: ['手肘固定', '不要借力', '控制下放']
                },
                {
                    id: 'hammer-curl',
                    name: '锤式弯举',
                    nameEn: 'Hammer Curl',
                    icon: '🔨',
                    description: '针对肱肌和前臂的训练',
                    muscles: ['肱肌', '肱桡肌'],
                    tips: ['手腕保持中立', '交替或同时进行']
                },
                {
                    id: 'tricep-pushdown',
                    name: '三头下压',
                    nameEn: 'Tricep Pushdown',
                    icon: '⬇️',
                    description: '三头肌孤立训练',
                    muscles: ['肱三头肌'],
                    tips: ['手肘贴紧身体', '完全伸直', '顶峰收缩']
                },
                {
                    id: 'skull-crusher',
                    name: '仰卧臂屈伸',
                    nameEn: 'Skull Crusher',
                    icon: '💀',
                    description: '三头肌长头训练动作',
                    muscles: ['肱三头肌长头'],
                    tips: ['手肘固定', '慢速控制', '注意安全']
                },
                {
                    id: 'concentration-curl',
                    name: '集中弯举',
                    nameEn: 'Concentration Curl',
                    icon: '🎯',
                    description: '高度孤立二头肌的训练',
                    muscles: ['肱二头肌'],
                    tips: ['肘部抵住大腿内侧', '顶峰挤压']
                },
                {
                    id: 'dip',
                    name: '臂屈伸',
                    nameEn: 'Dip',
                    icon: '🔽',
                    description: '自重三头肌训练',
                    muscles: ['肱三头肌', '胸大肌下部'],
                    tips: ['身体稍前倾练胸', '直立练三头']
                }
            ]
        }
    },

    // Get all body parts
    getAllBodyParts() {
        return Object.values(this.bodyParts);
    },

    // Get body part by ID
    getBodyPart(partId) {
        return this.bodyParts[partId] || null;
    },

    // Get exercises by body part
    getExercises(partId) {
        const part = this.bodyParts[partId];
        return part ? part.exercises : [];
    },

    // Get exercise by ID
    getExercise(partId, exerciseId) {
        const exercises = this.getExercises(partId);
        return exercises.find(ex => ex.id === exerciseId) || null;
    },

    // Search exercises
    searchExercises(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        Object.values(this.bodyParts).forEach(part => {
            part.exercises.forEach(exercise => {
                if (exercise.name.includes(query) || 
                    exercise.nameEn.toLowerCase().includes(lowerQuery) ||
                    exercise.description.includes(query)) {
                    results.push({
                        ...exercise,
                        bodyPart: part.id,
                        bodyPartName: part.name
                    });
                }
            });
        });
        
        return results;
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExerciseData;
}
