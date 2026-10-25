import { useState, useEffect } from 'react';

export default function DietPage() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
  fetch("http://localhost:3000/get-vitals", {
    method: "GET",
    credentials: "include"
  })
    .then((res) => res.json())
    .then((outcome) => {
      console.log("GET VITALS RESPONSE:", outcome);

      if (outcome.success && outcome.data) {
        setAge(outcome.data.age || '');
        setWeight(outcome.data.weight || '');
        setHeight(outcome.data.height || '');
        setGoal(outcome.data.goal || '');

        calculateAndDisplayDiet(
          outcome.data.age,
          outcome.data.weight,
          outcome.data.height,
          outcome.data.goal
        );
      }
    })
    .catch(console.error);
}, []);
   
  // 2. CORE NUTRITION CALCULATION PIPELINE
  function calculateAndDisplayDiet(rawAge, rawWeight, rawHeightInput, rawGoal) {
    let finalWeight = parseFloat(rawWeight);
    let rawHeight = parseFloat(rawHeightInput);
    let finalAge = parseInt(rawAge);
    let finalHeightCm = 170; 

    // Defensive Fallbacks matching your system
    if (!finalWeight || finalWeight <= 0) finalWeight = 60;
    if (!rawHeight || rawHeight <= 0) rawHeight = 170;
    if (!finalAge || finalAge <= 0) finalAge = 25;

    // INTELLIGENT AUTO-UNIT RECOGNITION PIPELINE
    if (rawHeight >= 30 && rawHeight <= 300) {
        finalHeightCm = rawHeight;
    } else if (rawHeight >= 0.5 && rawHeight <= 3.0) {
        finalHeightCm = rawHeight * 100;
    } else if (rawHeight >= 3.1 && rawHeight <= 9.9) {
        const feet = Math.floor(rawHeight);
        const inches = Math.round((rawHeight - feet) * 10); 
        const totalInches = (feet * 12) + inches;
        finalHeightCm = totalInches * 2.54;
    } else {
        finalHeightCm = 170;
    }

    // THE REAL BMI MATHEMATICAL EQUATION
    const heightMeters = finalHeightCm / 100;
    const bmiNum = finalWeight / (heightMeters * heightMeters);
    const bmi = (isNaN(bmiNum) || !isFinite(bmiNum)) ? 22.0 : parseFloat(bmiNum.toFixed(1));

    // METABOLIC MATHEMATICS
    const baseBMR = (10 * finalWeight) + (6.25 * finalHeightCm) - (5 * finalAge) + 5; 
    const tdeeEst = Math.round(baseBMR * 1.375); 
    
    let targetCalories = tdeeEst;
    let proteinTarget = Math.round(finalWeight * 1.5); 
    let targetWaterLiters = (finalWeight * 0.035).toFixed(1); 

    let alertBannerColor = "#2d89ef"; 
    let statusTitle = "COMPREHENSIVE METABOLIC ASSESSMENT";
    let innerHtmlOutput = "";

    let bmiCategory = "Normal Weight";
    if (bmi < 18.5) { bmiCategory = "Underweight"; }
    else if (bmi >= 25.0 && bmi < 30) { bmiCategory = "Overweight"; }
    else if (bmi >= 30) { bmiCategory = "Obese"; }

    // --- CASE 1: HEIGHT INCREASE PROTOCOLS ---
    if (rawGoal === "height") {
        if (finalAge >= 50) {
            alertBannerColor = "#d32f2f";
            statusTitle = "🚨 HEIGHT LOSS PREVENTION & BONE SHIELD";
            innerHtmlOutput = `
                <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #d32f2f; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px; color: #c0392b;"><strong>Honest Biological Reality:</strong> At <b>${finalAge} years old</b>, increasing vertical height (currently calculated at <b>${finalHeightCm.toFixed(0)} cm</b>) is physically impossible. We will not offer false suggestions.</p>
                </div>
                <h4 style="color: #c53030; margin-top: 20px; font-size: 15px;">⚠️ Why Aggressive Stretches Are Blocked:</h4>
                <p>At this stage, spinal discs naturally thin out. Attempting heavy hanging drills or extreme spine extensions <b>will not add height</b>—it places dangerous, unshielded shear forces onto vulnerable vertebrae, causing severe joint deterioration. Exercise should be restricted to light walks.</p>
                
                <h4 style="color: #2b6cb0; margin-top: 20px; font-size: 15px;">🛡️ Bone Mass Protection Metrics (Baseline Requirements):</h4>
                <p>To safely keep your current stature intact without compression, you require a foundational maintenance intake of <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b>.</p>

                <table style="width:100%; border-collapse: collapse; margin-top: 12px; font-size: 13.5px; background: #fafafa;">
                    <thead>
                        <tr style="background: #eaeaea; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Eat (Bone Support)</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Avoid (Bone Wasters)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>High Bio-Calcium:</b> Consume 1,200mg daily through simple, soft foods like warm dairy milk, low-fat curd, or 100g soft tofu/paneer.<br>
                                • <b>Vitamin D Catalysts:</b> Essential for bone matrix synthesis. Prioritize natural morning sunlight exposures.
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Excessive Caffeine:</b> Heavy strong coffee or tea flushes crucial calcium directly out via urine.<br>
                                • <b>High Sodium (Salt):</b> Processed salty foods structurally pull mineral minerals away from bone storage units.
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        } 
        else if (finalAge >= 22 && finalAge < 50) {
            alertBannerColor = "#ff9800";
            statusTitle = "POSTURE & SPINE DECOMPRESSION REPORT";
            innerHtmlOutput = `
                <div style="background: #fffbf2; padding: 15px; border-left: 4px solid #ff9800; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px;"><strong>Skeletal Summary:</strong> Age: <b>${finalAge} yrs</b> | Calibrated Standard Height: <b>${finalHeightCm.toFixed(0)} cm</b>. Natural long-bone growth windows have fully fused shut.</p>
                </div>
                <div style="background: #fff3f3; padding: 15px; border-left: 4px solid #c0392b; margin: 20px 0; border-radius: 4px;">
                    <h4 style="color: #c0392b; margin: 0 0 10px 0; font-size: 16px;">⚠️ WARNING: Exercise & Nutrition Sync</h4>
                    <p style="margin: 0; color: #3c4043; font-size: 14px;">
                        <b>Do not over-exercise without following this diet.</b> Forcing decompression movements while skipping the required <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b> triggers localized muscle wasting and joint strain.
                    </p>
                </div>
                <h4 style="color: #e67e22; margin-top: 15px; font-size: 15px;">🧘 Low-Stress Alignment Plan (Try with Care):</h4>
                <p>You can recover <b>1 to 1.5 inches of compressed posture height</b> by lengthening your supporting back muscles. Stop immediately if you feel pain.</p>
                
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13.5px; overflow:hidden; margin-bottom: 20px;">
                    <div style="padding:12px; border-bottom:1px solid #edf2f7;">🧗‍♂️ <b>1. Gentle Static Bar Hangs:</b> Grip an overhead bar securely and let your lower spine completely relax. Hold for 2 sets × 30 seconds every morning.</div>
                    <div style="padding:12px;">🧍‍♂️ <b>2. Wall Alignment Retraining:</b> Stand flat against a wall with heels, upper back, and shoulders compressed backward for 5 minutes in the evening to eliminate slouched postures.</div>
                </div>

                <table style="width:100%; border-collapse: collapse; font-size: 13.5px; background: #fafafa;">
                    <thead>
                        <tr style="background: #eaeaea; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Eat</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Avoid</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Skeletal Infrastructure Fuel:</b> Consume fresh milk, plain yogurt, and green leafy dishes.<br>
                                • Ensure adequate protein intake to maintain structural back muscle integrity.
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>High Sugars & Carbonated Soda:</b> Carbonated items contain phosphoric acids that accelerate cartilage degradation lines.
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        } 
        else {
            alertBannerColor = "#2ecc71";
            statusTitle = "🚀 ACTIVE NATURAL BONE GROWTH PROTOCOL";
            innerHtmlOutput = `
                <div style="background: #f4fbf7; padding: 15px; border-left: 4px solid #2ecc71; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px;"><strong>Growth Status:</strong> Age: <b>${finalAge} yrs</b> | Base Height: <b>${finalHeightCm.toFixed(0)} cm</b>. Natural epiphyseal growth plates are wide open!</p>
                </div>
                <div style="background: #fff3f3; padding: 15px; border-left: 4px solid #c0392b; margin: 20px 0; border-radius: 4px;">
                    <h4 style="color: #c0392b; margin: 0 0 10px 0; font-size: 16px;">⚠️ WARNING: Exercise & Nutrition Sync</h4>
                    <p style="margin: 0; color: #3c4043; font-size: 14px;">
                        <b>Do not over-exercise without following this diet.</b> Training heavily without matching your growth target metrics of <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b> will crash your recovery and stunt bone development.
                    </p>
                </div>

                <h4 style="color: #27ae60; margin-top: 20px; font-size: 15px;">🏋️‍♂️ Growth Plate Expansion Exercises:</h4>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13.5px; overflow:hidden; margin-bottom: 20px;">
                    <div style="padding:12px; border-bottom:1px solid #edf2f7;">🏃‍♂️ <b>1. High-Impact Ankle Jumps:</b> Jump straight up using calves. Land softly and explode upward. Do 3 sets × 30 reps every morning.</div>
                    <div style="padding:12px; border-bottom:1px solid #edf2f7;">🧗‍♂️ <b>2. Decompression Active Hanging:</b> Hold an overhead bar, pull shoulder blades slightly down for stabilization, and relax your legs completely. Do 3 sets × 45 seconds each morning.</div>
                    <div style="padding:12px;">🐍 <b>3. Dynamic Cobra Extension:</b> Push your chest up from a flat belly posture, look at the ceiling. Do 3 sets × 12 reps before dinner.</div>
                </div>

                <h4 style="color: #2b6cb0; margin-top: 20px; font-size: 15px;">🥦 Fuel & Nutrition to Grow Taller:</h4>
                <p style="font-size:13.5px; line-height:1.6; margin-bottom:15px;">
                    • <b>High-Quality Proteins:</b> Feed your growing framework with 3 whole eggs daily, grilled chicken breast, clean fish, or sprout salads.<br>
                    • <b>Bone-Density Builders:</b> Consume structural materials daily via Ragi rotis (finger millet), dairy milk, and soy beans to supply raw minerals.
                </p>

                <h4 style="color: #c53030; margin-top: 20px; font-size: 15px;">🚫 STUNTING FOODS TO AVOID (WHAT NOT TO EAT):</h4>
                <p style="font-size:13.5px; line-height:1.6; color:#4a5568; background:#fff5f5; padding:12px; border-radius:6px; border: 1px solid #feb2b2;">
                    • <b>Dark Colas & Sodas:</b> Phosphoric acid binds to intestinal calcium and flushes it out, bypassing your long growth bones.<br>
                    • <b>Refined Sugars & Maida:</b> Extreme sugar causes immediate insulin spikes, which scientifically suppresses human growth hormone (HGH) release waves.<br>
                    • <b>Late-Night Eating:</b> Avoid food 2 hours before sleeping. Heavy digestion stops the vital HGH hormone surges that occur during deep sleep patterns.
                </p>
            `;
        }
    }
    else if (rawGoal === "lose") {
        if (finalAge >= 60) {
            alertBannerColor = "#d32f2f";
            statusTitle = "🚨 WEIGHT LOSS BLOCKED • METABOLIC PROTECTION SHIELD";
            innerHtmlOutput = `
                <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #d32f2f; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px; color: #c0392b;"><strong>Honest Biological Assessment:</strong> At <b>${finalAge} years old</b> and height <b>${finalHeightCm.toFixed(0)} cm</b>, aggressive calorie restrictions are blocked to protect your health.</p>
                </div>
                <div style="background: #fff3f3; padding: 15px; border-left: 4px solid #c0392b; margin: 20px 0; border-radius: 4px;">
                    <h4 style="color: #c0392b; margin: 0 0 10px 0; font-size: 16px;">⚠️ WARNING: Exercise & Nutrition Sync</h4>
                    <p style="margin: 0; color: #3c4043; font-size: 14px;"><b>Do not over-exercise without following this diet.</b> Otherwise, you will cause deep muscle recovery failure states.</p>
                </div>
                
                <h4 style="color:#c53030; font-size:14px; margin-top:15px;">⚠️ CRITICAL REASONING FOR THE RESTRICTION:</h4>
                <p style="font-size:13px; line-height:1.6; color:#4a5568;">
                    Dropping calories aggressively in this age may causes severe, irreversible bone density degradation (osteopenia) and triggers muscle wasting (sarcopenia). Losing this muscle structural support compromises balance control, placing joints at an extreme risk for fractures. Your absolute focus must be on <b>metabolic stability</b>.
                </p>

                <p style="font-size:13.5px;">For safe longevity, maintain your baseline target parameters at <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b>.</p>
                
                <h4 style="color:#2b6cb0; font-size:14px; margin-top:15px;">📋 SENIOR NUTRITION STABILIZATION ROUTINE</h4>
                <table style="width:100%; border-collapse: collapse; font-size: 13.5px; background: #fafafa; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #eaeaea; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Eat (Soft Protective Proteins)</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Strictly Avoid</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Soft Amino Proteins:</b> Steamed lentil idlis, thoroughly boiled dal soups, fresh dahi (curd), soft paneer, and egg white scrambles to maintain lean muscle mass.<br>
                                • <b>High Bio-Calcium Fields:</b> Daily low-fat dairy milk to protect bone structural density.
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Intermittent Fasting or Meal Skipping:</b> Starving triggers your body to break down its own muscle tissue for energy.<br>
                                • <b>High-Oxalate Raw Foods:</b> Avoid excessive unblanched raw spinach or heavy bran, which lock onto dietary calcium and prevent absorption.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="color:#27ae60; font-size:14px; margin-top:15px;">🧘 SAFE SENIOR LONGEVITY EXERCISES & LIFESTYLE:</h4>
                <p style="font-size:13px; margin: 0 0 10px 0; color: #4a5568;">High-impact workouts (running, heavy lifting) must be avoided to protect your joints from structural wear. Use this safe alternative track instead:</p>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🚶‍♂️ <b>1. Low-Impact Mobility Walking:</b> 20–30 minutes of gentle, rhythmic walking on a flat, even surface daily. This preserves heart health and joint lubrication without overstressing cartilage.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🪑 <b>2. Assisted Chair Squats:</b> 2 sets × 8 repetitions using a sturdy chair for support. Keeps your quadriceps and glutes strong to maintain natural daily balance.</div>
                    <div style="padding:10px;">🧠 <b>3. Mindful Breathing & Meditation:</b> 10 minutes of slow, deep diaphragmatic breathing daily. This balances cortisol (the stress hormone), which naturally helps curb anxiety and shields bone structures from stress-induced mineral loss.</div>
                </div>
            `;
        }
        else if (bmi < 18.5) {
            alertBannerColor = "#f44336";
            statusTitle = "🚨 WEIGHT LOSS RESTRICTED • REASON: ALREADY LEAN";
            innerHtmlOutput = `
                <div style="background: #fdf2f2; padding: 15px; border-left: 4px solid #f44336; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px; color: #c0392b;"><strong>Critical Frame Alarm:</strong> BMI is already at a lean value of <b>${bmi}</b> for height <b>${finalHeightCm.toFixed(0)} cm</b>.</p>
                </div>
                <p>Weight dropping is overridden. Stick to maintenance values of <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b> to preserve vital organ cushions.</p>
                
                <h4 style="color:#e74c3c; font-size:14px; margin-top:15px;">📋 WHAT TO EAT AND AVOID FOR RECOVERY:</h4>
                <p style="font-size:13.5px;">• <b>What to Eat:</b> Complex grains, avocados, mixed nuts, and peanut spreads to support baseline tissues.<br>• <b>What to Avoid:</b> Fat-burning teas, excessive fasting windows, and high-intensity continuous conditioning without caloric recovery.</p>
            `;
        } 
        else {
            targetCalories = Math.round(tdeeEst - 500); 
            proteinTarget = Math.round(finalWeight * 1.8); 
            const finalCarbTarget = Math.round((targetCalories - (proteinTarget * 4) - (Math.round((targetCalories * 0.25) / 9) * 9)) / 4);
            const finalFatTarget = Math.round((targetCalories * 0.25) / 9);

            alertBannerColor = "#2ecc71";
            statusTitle = "✅ SAFE METABOLIC FAT LOSS PROTOCOL";
            innerHtmlOutput = `
                <div style="background: #f4fbf7; padding: 15px; border-left: 4px solid #2ecc71; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14.5px;"><strong>Safe to Proceed:</strong> Calibrated height: <b>${finalHeightCm.toFixed(0)} cm</b> | Current BMI: <b>${bmi} (${bmiCategory})</b>.</p>
                </div>
                <div style="background: #fff3f3; padding: 15px; border-left: 4px solid #c0392b; margin: 20px 0; border-radius: 4px;">
                    <h4 style="color: #c0392b; margin: 0 0 10px 0; font-size: 16px;">⚠️ WARNING: Exercise & Nutrition Sync</h4>
                    <p style="margin: 0; color: #3c4043; font-size: 14px;"><b>Do not over-exercise without following this diet.</b> Otherwise, you will cause deep muscle recovery failure states.</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 20px;">
                    <div style="background:#f8f9fa; border:1px solid #e2e8f0; border-radius:6px; padding:10px; text-align:center;"><span style="font-size:11px; color:#718096; display:block; font-weight:bold;">DEFICIT CALORIES</span><strong style="font-size:16px; color:#2d3748;">${targetCalories} kcal</strong></div>
                    <div style="background:#f0fff4; border:1px solid #c6f6d5; border-radius:6px; padding:10px; text-align:center;"><span style="font-size:11px; color:#22543d; display:block; font-weight:bold;">PROTEIN</span><strong style="font-size:16px; color:#22543d;">${proteinTarget}g</strong></div>
                    <div style="background:#fffaf0; border:1px solid #feebc8; border-radius:6px; padding:10px; text-align:center;"><span style="font-size:11px; color:#744210; display:block; font-weight:bold;">CARBS</span><strong style="font-size:16px; color:#744210;">${finalCarbTarget}g</strong></div>
                    <div style="background:#edf2f7; border:1px solid #e2e8f0; border-radius:6px; padding:10px; text-align:center;"><span style="font-size:11px; color:#4a5568; display:block; font-weight:bold;">FATS</span><strong style="font-size:16px; color:#4a5568;">${finalFatTarget}g</strong></div>
                </div>

                <h4 style="color:#2b6cb0; margin: 15px 0 8px 0; font-size:14.5px;">📋 FAT BURN DAILY MEAL SCHEDULE</h4>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13.5px; overflow:hidden; margin-bottom:15px;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🌅 <b>Breakfast (08:30 AM):</b> Oats in water + 3 boiled egg whites or 80g low-fat paneer cooked with fresh spinach leaves.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">☀️ <b>Lunch (01:30 PM):</b> Raw green salad bowl + brown rice + 150g grilled chicken breast or boiled yellow moong dal soup.</div>
                    <div style="padding:10px;">🌙 <b>Dinner (08:30 PM):</b> Deep vegetable broth + 120g hard tofu cubes air-fried with broccoli.</div>
                </div>

                <h4 style="color: #c53030; font-size: 14px; margin: 15px 0 8px 0;">🚫 WHAT NOT TO EAT (METABOLIC FAT-BLOCKERS):</h4>
                <div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6; color: #2d3748; margin-bottom: 15px;">
                    • <b>Refined Seed Oils (Mayonnaise, Commercial Salad Dressings):</b> Highly processed oils stall mitochondrial energy output, creating an uphill battle for fat mobilization.<br>
                    • <b>Hidden liquid Sugars (Packaged Juices, Flavored Yogurts):</b> These remove protective fibers, sending insulin levels soaring. High insulin acts like a chemical padlock on stored body fat, stopping it from breaking down.<br>
                    • <b>White Flour (Maida, White Bread):</b> Offers zero nutritional value and digests instantly, causing rapid hunger crashes that trigger overeating.
                </div>

                <h4 style="color:#e67e22; font-size:14px; margin-top:15px;">🏃‍♂️ METABOLIC CIRCUITS & ACTIVITY:</h4>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🚶‍♂️ <b>1. Fast-Paced Cardio:</b> 30 minutes of brisk walking or steady cycling 4 times a week to keep fat oxidation active without losing muscle mass.</div>
                    <div style="padding:10px;">🏋️‍♂️ <b>2. Full-Body Strength Training:</b> 3 sets × 15 repetitions of air squats and pushups to demand energy output from large muscle groups.</div>
                </div>
                <br>
                <p style="margin:0;">Drink exactly <b>${targetWaterLiters} L</b> of clear water daily to flush out cellular metabolic fragments.</p>
            `;
        }
     }
     else if (rawGoal === "gain") {
        if (finalAge >= 60) {
            alertBannerColor = "#d32f2f";
            statusTitle = "🚨 WEIGHT GAIN SHUT DOWN • INTERNAL SAFETY PROTOCOL";
            innerHtmlOutput = `
                <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #d32f2f; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px; color: #c0392b;"><strong>Critical Biological Restriction:</strong> Forcing heavy caloric weight surges is locked at height <b>${finalHeightCm.toFixed(0)} cm</b> to ensure organic systemic protection.</p>
                </div>
                
                <h4 style="color:#c53030; font-size:14px; margin-top:15px;">⚠️ WHY FORCING WEIGHT GAIN IS RESTRICTED OVER 60:</h4>
                <p style="font-size:13px; line-height:1.6; color:#4a5568;">
                    In advanced age (60 to 90+), forcing a massive calorie surplus does not synthesize youthful skeletal muscle mass. Instead, the extra energy converts instantly into <b>visceral fat</b> that packs tightly around your internal organs (heart, liver, and pancreas). This triggers sudden blood pressure spikes, severe cardiovascular strain, fatty liver advancement, and overburdens fragile spinal structures. Scale bloating is highly unsafe at this stage of life.
                </p>

                <p style="font-size:13.5px;">Maintain stable systemic energy levels with: <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b>.</p>

                <table style="width:100%; border-collapse: collapse; font-size: 13.5px; background: #fafafa; margin-top: 15px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #eaeaea; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Eat (Prevent Muscle Wasting)</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What NOT to Eat (Visceral Fat Triggers)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Soft Digestible Nitrogen Foods:</b> Creamy soft paneer, plain curd/yogurt, mashed well-cooked yellow moong dal lentils, soft tofu, and egg white scrambles to preserve muscle tissue.<br>
                                • <b>Healthy Fats:</b> Soaked unpeeled almonds and walnuts to deliver raw cardiovascular support.
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Heavy Sugars & Deep Fried Junk:</b> High-glycemic sweets, deep-fried snacks, and heavy ghee overloading. These ruin fragile older digestive tracts and create systemic lipid inflammation.<br>
                                • <b>Commercial Gainer Powders:</b> Chemical-heavy filler items that severely strain senior kidney filtration markers.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="color:#27ae60; font-size:14px; margin-top:15px;">🧘 SAFE MOBILITY & STABILITY ROUTINE (SUITED FOR AGES 60 TO 90+):</h4>
                <p style="font-size:13px; margin: 0 0 10px 0; color: #4a5568;">Heavy loading styles are completely blocked to eliminate joint friction. Perform these safe activities to protect motor coordination boundaries:</p>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🪑 <b>1. Chair-Assisted Knee Extensions:</b> Sit straight up on a secure household chair. Slowly straighten your right leg outward, hold for 3 seconds, and lower it. Alternate sides. Perform 2 sets × 10 repetitions to preserve quadriceps stability.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🚶‍♂️ <b>2. Assisted Counter Walk or Flat Walk:</b> Gentle walking for 15–20 minutes daily on a uniform, flat surface. Keeps bone density active and pumps blood safely through joint channels.</div>
                    <div style="padding:10px;">🧘 <b>3. Mindful Deep Breathing & Chair Meditation:</b> 5–10 minutes of controlled breathing. Lowers autonomic stress markers, which actively stops stress hormones from accelerating natural age-related muscle deterioration.</div>
                </div>
            `;
        }
        else if (bmi >= 25.0) {
            alertBannerColor = "#f44336";
            statusTitle = "🚨 WEIGHT GAIN RESTRICTED • REASON: PROFILE CAPACITY REACHED";
            innerHtmlOutput = `
                <div style="background: #fdf2f2; padding: 15px; border-left: 4px solid #f44336; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0;"><strong>System Load Warning:</strong> Your current mass metrics have reached safe skeletal structural boundaries for height <b>${finalHeightCm.toFixed(0)} cm</b> (Current BMI: <b>${bmi}</b>).</p>
                </div>
                
                <h4 style="color:#c53030; font-size:14px; margin-top:15px;">⚠️ WHY ADDING ADDITIONAL CALORIC WEIGHT IS RESTRICTED:</h4>
                <p style="font-size:13px; line-height:1.6; color:#4a5568;">
                    Forcing a calorie surplus when your body profile is already classified as <b>${bmiCategory}</b> will not result in clean athletic size. Instead, it overloads metabolic receptors, spikes insulin resistance flags, damages cardiovascular pathways, and creates unnecessary compression strain on ankle and knee cartilage. Your focus must shift from "weight gain" to <b>body recomposition</b> (building muscle while shedding fat).
                </p>

                <p style="font-size:13.5px;">Keep daily intakes strictly to clean baseline target values: <b>${targetCalories} kcal</b> and <b>${proteinTarget}g protein</b>.</p>

                <table style="width:100%; border-collapse: collapse; font-size: 13.5px; background: #fafafa; margin-top: 15px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #eaeaea; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Eat (Recomposition Anchors)</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">What to Strictly Avoid</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Lean Structural Proteins:</b> Skinless grilled chicken breast, baked tofu blocks, boiled split-pea dals, boiled egg whites, and sprouts to maintain lean muscle mass density.<br>
                                • <b>Fibrous Complex Greens:</b> Broccoli, cucumbers, capsicums, and steamed green beans to keep your digestion working efficiently.
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top; line-height: 1.6;">
                                • <b>Mass Gainers & High Carbs:</b> Commercial mass gainer powders, excessive white rice bowls, processed maida bakery items, and sweet sodas. These immediately convert into subcutaneous fat storage cells.<br>
                                • <b>Late-Night High Calorie Snacking:</b> Eating heavy meals within 2 hours of sleeping locks your metabolism into fat-storage mode.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="color:#2b6cb0; font-size:14px; margin-top:15px;">🏋️‍♂️ RECOMPOSITION STRENGTH EXERCISES (BUILD MUSCLE, NOT FAT):</h4>
                <p style="font-size:13px; margin: 0 0 10px 0; color: #4a5568;">Stop tracking weight increases on the scale. Use these bodyweight resistance moves to stimulate lean density transformation blocks:</p>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🚶‍♂️ <b>1. Incline or Flat Brisk Cardio:</b> 25–30 minutes of fast-paced brisk walking 4 times a week. This burns calories efficiently without over-straining heavy lower-body joints.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">💪 <b>2. Controlled Bench/Wall Push-Ups:</b> 3 sets × 12 repetitions. Demands upper body core activation to support heavy lean tissues.</div>
                    <div style="padding:10px;">🦵 <b>3. Slow Air Squats (Assisted if needed):</b> 3 sets × 10 repetitions. Forces major lower-body muscle fibers to draw energy directly from existing body fat cells.</div>
                </div>
            `;
        }
        else {
            targetCalories = Math.round(tdeeEst + 400); 
            proteinTarget = Math.round(finalWeight * 1.6);

            alertBannerColor = "#2ecc71";
            statusTitle = "🚀 CLEAN ANABOLIC MASS & MUSCLE TRACK";
            innerHtmlOutput = `
                <div style="background: #f4fbf7; padding: 15px; border-left: 4px solid #2ecc71; margin-bottom: 20px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14.5px;"><strong>Safe Clean Mass Track Active:</strong> Surpluses verified for tissue expansion calculations at height <b>${finalHeightCm.toFixed(0)} cm</b>.</p>
                </div>
                <div style="background: #fff3f3; padding: 15px; border-left: 4px solid #c0392b; margin: 20px 0; border-radius: 4px;">
                    <h4 style="color: #c0392b; margin: 0 0 10px 0; font-size: 16px;">⚠️ WARNING: Exercise & Nutrition Sync</h4>
                    <p style="margin: 0; color: #3c4043; font-size: 14px;"><b>Do not over-exercise without following this diet.</b> Otherwise, you will cause deep muscle recovery failure states.</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom:20px;">
                    <div style="background:#f0fff4; padding:10px; text-align:center; border:1px solid #edf2f7; border-radius:6px;">🔥 SURPLUS:<br><strong style="font-size:16px; color:#22543d;">${targetCalories} kcal</strong></div>
                    <div style="background:#edf2f7; padding:10px; text-align:center; border:1px solid #edf2f7; border-radius:6px;">💪 PROTEIN:<br><strong style="font-size:16px; color:#2d3748;">${proteinTarget}g</strong></div>
                </div>

                <h4 style="color:#27ae60; font-size:14px; margin:15px 0 8px 0;">📋 ANABOLIC BULKING SCHEDULE:</h4>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13.5px; overflow:hidden; margin-bottom:15px;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🌅 <b>Breakfast:</b> 3 whole eggs scrambled or 100g paneer with 2 whole wheat rotis and a handful of almonds.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">☀️ <b>Lunch:</b> Thick dal soup, mixed bean salad, chicken stir fry or tofu rice layout.</div>
                    <div style="padding:10px;">🌙 <b>Dinner:</b> Baked potato mash with lean paneer steak or fish curry slices.</div>
                </div>

                <h4 style="color: #c53030; font-size: 14px; margin: 15px 0 8px 0;">🚫 WHAT NOT TO EAT (DIRTY BULKING HAZARDS):</h4>
                <div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6; color: #2d3748; margin-bottom: 15px;">
                    • <b>Deep-Fried Fast Foods (Samosas, French Fries, Pakoras):</b> Packed with industrial trans fats that trigger cellular inflammation, causing added calories to settle as visceral belly fat rather than muscle.<br>
                    • <b>Sugary Confections & Commercial Shakes:</b> Excessive refined white sugars create massive insulin volatility. This suppresses natural testosterone/growth hormone synthesis and strains your liver metabolism.<br>
                    • <b>Processed Meats (Sausages, Cold Cuts):</b> Contain high quantities of sodium preservatives that cause severe fluid retention and mask actual lean muscle tissue expansion.
                </div>

                <h4 style="color:#2b6cb0; font-size:14px; margin-top:15px;">🏋️‍♂️ MANDATORY COMPOUND MASS EXERCISES:</h4>
                <p style="font-size:13px; margin: 0 0 10px 0; color: #4a5568;">You must supply a mechanical stimulus to direct surplus calories into muscle synthesis rather than body fat stores. Perform this routine 3–4 times a week:</p>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">🦵 <b>1. Bodyweight or Weighted Squats:</b> 4 sets × 12 repetitions. Stimulates massive lower-body motor unit recruitment.</div>
                    <div style="padding:10px; border-bottom:1px solid #edf2f7;">💪 <b>2. Standard or Incline Push-ups:</b> 4 sets × 10–15 repetitions. Targets chest, anterior deltoids, and triceps structures.</div>
                    <div style="padding:10px;">🧗‍♂️ <b>3. Doorframe Rows or Pull-ups:</b> 4 sets × 8–12 repetitions. Essential for structural posterior back and core thickness.</div>
                </div>
            `;
        }
      }
    setReportData({
      title: statusTitle,
      bannerColor: alertBannerColor,
      htmlContent: innerHtmlOutput
    });
  }

  const handleFormSubmission = () => {
    if (!age || !weight || !height || !goal) {
      alert("Please enter all metrics");
      return;
    }
    calculateAndDisplayDiet(age, weight, height, goal);
  };

  return (
    <div id="dietPage" className="page">
      <h3>🥗 Personal AI Diet & Health Advisor</h3>
      
      <div id="dietFormSection" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <h4>Enter Your Vitals to Begin:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="number" 
            id="dietAge" 
            placeholder="Age (years)" 
            min="1" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
          />
          <input 
            type="number" 
            id="dietWeight" 
            placeholder="Current Weight (kg)" 
            min="1" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
          />
          <input 
            type="number" 
            id="dietHeight" 
            placeholder="Height (cm)" 
            min="1" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
          />
          
          <select id="dietGoal" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">-- Select Your Goal --</option>
            <option value="lose">Decrease Weight</option>
            <option value="gain">Increase Weight</option>
            <option value="height">Increase Height</option>
          </select>
        </div>
        <button 
          onClick={handleFormSubmission} 
          style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
        >
          Get Personalized Health Plan
        </button>
      </div>

      {reportData && (
        <div style={{ background: '#fff', border: `1px solid ${reportData.bannerColor}`, borderRadius: '8px', overflow: 'hidden', marginTop: '15px' }}>
          <div style={{ background: reportData.bannerColor, color: '#fff', padding: '12px 16px', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {reportData.title}
          </div>
          <div 
            id="dietReportOutput" 
            style={{ padding: '20px', lineHeight: '1.6', color: '#333' }}
            dangerouslySetInnerHTML={{ __html: reportData.htmlContent }} 
          />
        </div>
      )}
    </div>
  );
}