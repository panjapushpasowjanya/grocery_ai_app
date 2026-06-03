const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); 
const session = require("express-session");
const { MeiliSearch } = require("meilisearch");

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "grocery_ai_app"
});

db.connect((err) => {
    if(err) {
        console.log(err);
    } else {
        console.log("MySQL Connected");
    }
});

// Initialize Meilisearch Client

const client = new MeiliSearch({
    host: 'https://ms-3806525e82c9-49135.sgp.meilisearch.io',
    apiKey: '3be49e5e7ea2caef966ccce4f15d0a45613a2e2c'
});

const index = client.index('grocery_products');

//  REAL-TIME MEILISEARCH AUTO-SUGGEST ENDPOINT

app.get("/suggest", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === "") {
            return res.json([]);
        }

        const searchResults = await index.search(query, {
            limit: 5
        });

        const suggestions = searchResults.hits.map(hit => {
            return hit.item_name || hit.name || hit.product_name || hit.title || "";
        }).filter(item => item !== ""); 
        
        res.json(suggestions);
    } catch (error) {
        console.error("Meilisearch Query Error:", error);
        res.json([]); 
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("SMTP READY");
    }
});

// SMART DICTIONARY FOR LOOSE AND UNBARCODED ITEMS

const looseItemsDictionary = {
    "apple": { calories: 52, sugar_g: 10, fat_g: 0.2, sodium_mg: 1, health_grade: "A", status: "good", advisory: "Excellent source of fiber and vitamin C. Great daily snack!" },
    "orange": { calories: 47, sugar_g: 9, fat_g: 0.1, sodium_mg: 0, health_grade: "A", status: "good", advisory: "Packed with Vitamin C and hydration. Highly recommended!" },
    "spinach": { calories: 23, sugar_g: 0.4, fat_g: 0.4, sodium_mg: 79, health_grade: "A", status: "good", advisory: "Superfood! Rich in iron, potassium, and vitamins." },
    "milk": { calories: 42, sugar_g: 5, fat_g: 1.0, sodium_mg: 44, health_grade: "B", status: "good", advisory: "Good source of calcium and protein. Monitor fat intake if consuming whole milk." },
    "rice": { calories: 130, sugar_g: 0.1, fat_g: 0.3, sodium_mg: 1, health_grade: "C", status: "good", advisory: "Staple energy source. Balance your meal with fiber-rich vegetables." },
    "coconut oil": { calories: 862, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "Pure energy source, but 100% fat. Use moderately for cooking!" },
    "sunflower oil": { calories: 884, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "High calorie cooking oil. Use sparingly to keep heart health in check." },
    "rice rich oil": { calories: 884, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "High calorie cooking oil matrix. Track dynamic lipids consumption." }
};

// SIGNUP

app.post("/signup", async (req, res) => {
    const { name, email, password, familySize } = req.body;
    if(!name || !email || !password) {
        return res.json({ success: false, message: "All fields required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sizeOfFamily = Number(familySize) || 4;

    const sql = `INSERT INTO users(name, email, password, family_size) VALUES (?, ?, ?, ?)`;
    db.query(sql, [name, email, hashedPassword, sizeOfFamily], (err, result) => {
        if(err){
            if(err.code === "ER_DUP_ENTRY"){
                if (err.sqlMessage && err.sqlMessage.includes(email)) {
                    return res.json({ success: false, message: "Email already exists" });
                }
                return res.json({ success: false, message: "Username/Name is already taken." });
            }
            return res.json({ success: false, message: "Database error" });
        }
        return res.json({ success: true, message: "Signup successful" });
    });
});

// LOGIN

app.post("/login", (req, res) => {
    const { loginInput, password } = req.body;
    if(!loginInput || !password) {
        return res.json({ success: false, message: "Enter email and password" });
    }
    const sql = `SELECT * FROM users WHERE email = ? OR name = ?`;
    db.query(sql, [loginInput, loginInput], async (err, result) => {
        if(result.length === 0) {
            return res.json({ success: false, message: "User not found" });
        }
        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                family_size: user.family_size || 4 
            };
            res.json({ success: true, user: req.session.user });
        } else {
            res.json({ success: false, message: "Wrong password" });
        }
    });
});

// GET PROFILE

app.get("/profile-data", (req, res) => {
    if(!req.session.user){ return res.json({ loggedIn: false }); }
    const userId = req.session.user.id;
    const sql = `SELECT COUNT(*) AS totalItems FROM grocery_items WHERE user_id = ?`;
    db.query(sql, [userId], (err, result) => {
        res.json({
            loggedIn: true,
            name: req.session.user.name,
            email: req.session.user.email,
            totalItems: result[0].totalItems
        });
    });
});

// LOGOUT

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// UPDATED: FORGOT PASSWORD USING GMAIL NODEMAILER (WORKS UNRESTRICTED)

app.post("/forgot-password", (req, res) => {
    const { email } = req.body;
    const targetEmail = email ? email.trim().toLowerCase() : "";

    const sql = `SELECT * FROM users WHERE LOWER(TRIM(email)) = ?`;
    
    db.query(sql, [targetEmail], (err, result) => {
        if (err) {
            console.error("Database error during password reset:", err);
            return res.json({ success: false, message: "Database error" });
        }
        if (result.length === 0) {
            return res.json({ success: false, message: "Email not found in database record." });
        }

        const user = result[0];

        // Email layout content options

        const mailOptions = {
            from: '"Smart Grocery AI" <pushpasowjanya061@gmail.com>',
            to: targetEmail, 
            subject: 'Reset Your Password - Smart Grocery AI',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password for your Smart Grocery AI account.</p>
                    <p>Click the button below to update your password credentials safely:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000/reset-password.html?email=${encodeURIComponent(targetEmail)}" 
                           style="background: #2d89ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                           Change Password
                        </a>
                    </div>
                    <small style="color: #777;">If you did not request this, please ignore this email securely.</small>
                </div>
            `
        };

        // Dispatching the notification via Nodemailer

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Nodemailer Forgot Password Failure Log:", error);
                return res.json({ success: false, message: "Failed to dispatch recovery mail." });
            }
            console.log("🚀 Gmail system accepted delivery request successfully:", info.response);
            return res.json({ success: true, message: "Reset email sent successfully!" });
        });
    });
});

// POST ACTION TO CHANGE PASSWORD MATRIX

app.post("/update-password-action", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: "Missing data parameters." });
    }

    try {
        const hashedNewPassword = await bcrypt.hash(password, 10);
        
        const updateSql = `UPDATE users SET password = ? WHERE email = ?`;
        db.query(updateSql, [hashedNewPassword, email], (err, result) => {
            if (err) return res.json({ success: false, message: "Failed to query update state values." });
            return res.json({ success: true, message: "Password updated successfully! You can log in now." });
        });
    } catch (error) {
        return res.json({ success: false, message: "Encryption helper system error." });
    }
});

// ADD GROCERY ITEM (INTERCEPTS LOOSE ITEMS W/ DICTIONARY)

app.post("/add-item", (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: "Login required" });
    }

    let { 
        item_name, quantity, unit, 
        calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade,
        packet_count, package_type, package_size, package_unit
    } = req.body;

    item_name = item_name ? item_name.toLowerCase().trim() : "";
    quantity = Number(quantity) || 1;
    unit = unit ? unit.toLowerCase().trim() : "units";
    const userId = req.session.user.id;

    if (looseItemsDictionary[item_name] && (!calories || calories == 0)) {
        const dict = looseItemsDictionary[item_name];
        calories = dict.calories;
        fat_g = dict.fat_g;
        sugar_g = dict.sugar_g;
        sodium_mg = dict.sodium_mg;
        health_grade = dict.health_grade;
    } else {
        calories = Number(calories) || 0;
        fat_g = Number(fat_g) || 0;
        sugar_g = Number(sugar_g) || 0;
        protein_g = Number(protein_g) || 0;
        sodium_mg = Number(sodium_mg) || 0;
        health_grade = (health_grade || 'C').toUpperCase();
    }

    const checkSql = `SELECT * FROM grocery_items WHERE user_id = ? AND item_name = ? AND unit = ?`;
    db.query(checkSql, [userId, item_name, unit], (err, result) => {
        if (err) return res.json({ success: false, message: "DB error" });

        if (result.length > 0) {
            const existing = result[0];
            const newQty = Number(existing.quantity) + quantity;
            const newPackageCount = existing.packet_count ? (Number(existing.packet_count) + (Number(packet_count) || 0)) : packet_count;

            db.query(
                `UPDATE grocery_items SET quantity = ?, packet_count = ? WHERE id = ?`,
                [newQty, newPackageCount, existing.id],
                (err2) => {
                    if (err2) return res.json({ success: false, message: "Update failed" });
                    return res.json({ success: true, message: "Quantity updated successfully" });
                }
            );
        } else {
            const insertSql = `
                INSERT INTO grocery_items 
                (user_id, item_name, quantity, unit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade, packet_count, package_size, package_unit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(
                insertSql,
                [
                    userId, item_name, quantity, unit, 
                    calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade,
                    packet_count || null, package_size || null, package_unit || null
                ],
                (err3) => {
                    if (err3) {
                        console.error("MySQL Error Details:", err3);
                        return res.json({ success: false, message: "Insert item failed" });
                    }
                    return res.json({ success: true, message: "Item saved successfully" });
                }
            );
        }
    });
});

// SAVE USER VITALS AND DIET GOALS

app.post("/save-vitals", (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: "Login required" });
    }

    const userId = req.session.user.id;
    const { age, weight, height, goal } = req.body;

    // Validate incoming structural values

    if (!age || !weight || !height || !goal) {
        return res.json({ success: false, message: "Missing required vitals data fields" });
    }

    const updateSql = `
        UPDATE users 
        SET age = ?, weight_kg = ?, height_cm = ?, health_goal = ? 
        WHERE id = ?
    `;

    db.query(updateSql, [Number(age), Number(weight), Number(height), goal, userId], (err, result) => {
        if (err) {
            console.error("SQL Error saving vitals:", err);
            return res.json({ success: false, message: "Database update error" });
        }
        return res.json({ success: true, message: "Vitals updated successfully!" });
    });
});

// FETCH SAVED USER VITALS ON ROUTE INITIALIZATION

app.get("/get-vitals", (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, loggedIn: false });
    }

    const userId = req.session.user.id;
    const sql = `SELECT age, weight_kg as weight, height_cm as height, health_goal as goal FROM users WHERE id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) return res.json({ success: false, message: "DB Error fetching vitals" });
        
        if (result.length > 0 && result[0].age !== null) {
            return res.json({ success: true, loggedIn: true, data: result[0] });
        } else {
            return res.json({ success: false, loggedIn: true, message: "No vitals configured yet." });
        }
    });
});

app.post("/decrease-item", (req, res) => {
    if(!req.session.user) { return res.json({ success: false, message: "Login required" }); }
    const id = req.body.id;
    const amount = Number(req.body.amount || 1);

    db.query(`SELECT * FROM grocery_items WHERE id = ? AND user_id = ?`, [id, req.session.user.id], (err, result) => {
        if(err || result.length === 0){ return res.json({ success: false, message: "Item not found" }); }
        const item = result[0];
        const newQty = Number(item.quantity) - amount;

        if(newQty <= 0){
            db.query(`DELETE FROM grocery_items WHERE id = ?`, [id], () => {
                return res.json({ success: true, message: "Item removed" });
            });
        } else {
            db.query(`UPDATE grocery_items SET quantity = ? WHERE id = ?`, [newQty, id], () => {
                return res.json({ success: true, message: "Quantity decreased" });
            });
        }
    });
});


// ROUTE 1: Save or Update daily fitness data records inside MySQL

app.post('/api/health/save', (req, res) => {
    // Security Guard: Ensure user is logged in

    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const userId = req.session.user.id;
    const { metrics } = req.body;
    const todayDate = new Date().toISOString().split('T')[0]; 
    
    if (!metrics) {
        return res.status(400).json({ success: false, message: "Missing tracking metrics payload parameters." });
    }

    // High-efficiency MySQL Upsert Query 

    const sqlSaveQuery = `
        INSERT INTO user_health_metrics 
            (user_id, tracking_date, weight_kg, goal_type, steps_walked, calories_burned, 
             calories_eaten, heart_points, move_minutes, distance_km, target_steps, 
             target_heart_points, target_calorie_burn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            weight_kg = VALUES(weight_kg),
            goal_type = VALUES(goal_type),
            steps_walked = VALUES(steps_walked),
            calories_burned = VALUES(calories_burned),
            calories_eaten = VALUES(calories_eaten),
            heart_points = VALUES(heart_points),
            move_minutes = VALUES(move_minutes),
            distance_km = VALUES(distance_km),
            target_steps = VALUES(target_steps),
            target_heart_points = VALUES(target_heart_points),
            target_calorie_burn = VALUES(target_calorie_burn);
    `;

    const queryParameters = [
        userId, todayDate, metrics.weightKg, metrics.goalType, metrics.stepsWalked,
        metrics.caloriesBurned, metrics.caloriesEaten, metrics.heartPoints,
        metrics.moveMinutes, metrics.distanceKm, metrics.targetSteps,
        metrics.targetHeartPoints, metrics.targetCalorieBurn
    ];

    db.query(sqlSaveQuery, queryParameters, (err, result) => {
        if (err) {
            console.error("MySQL Health Sync Failure:", err);
            return res.status(500).json({ success: false, message: "Internal server database error." });
        }
        return res.json({ success: true, message: "MySQL database sync completed successfully." });
    });
});

// ROUTE 2: Fetch current active day's metrics record

app.get('/api/health/status', (req, res) => {
    // Security Guard: Ensure user is logged in


    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const userId = req.session.user.id;
    const todayDate = new Date().toISOString().split('T')[0];

    const sqlFetchQuery = `
        SELECT * FROM user_health_metrics 
        WHERE user_id = ? AND tracking_date = ? 
        LIMIT 1
    `;

    db.query(sqlFetchQuery, [userId, todayDate], (err, rows) => {
        if (err) {
            console.error("MySQL Health Retrieval Failure:", err);
            return res.status(500).json({ success: false, message: "Failed to read database state metrics." });
        }
        
        if (rows.length === 0) {
            // Safe Baseline Fallback: If a user logs in for the first time today, 
            // send standard defaults so the front-end dashboard constructs cleanly.

            return res.json({
                success: true,
                metrics: {
                    weightKg: 70, goalType: 'maintain', stepsWalked: 0,
                    caloriesBurned: 0, caloriesEaten: 0, heart_points: 0,
                    moveMinutes: 0, distanceKm: 0, targetSteps: 8000,
                    targetHeartPoints: 30, targetCalorieBurn: 300
                }
            });
        }

        // Profile mapping conversion to standard camelCase for script.js execution consistency

        const record = rows[0];
        return res.json({
            success: true,
            metrics: {
                weightKg: record.weight_kg,
                goalType: record.goal_type,
                stepsWalked: record.steps_walked,
                caloriesBurned: record.calories_burned,
                caloriesEaten: record.calories_eaten,
                heartPoints: record.heart_points,
                moveMinutes: record.move_minutes,
                distanceKm: record.distance_km,
                targetSteps: record.target_steps,
                targetHeartPoints: record.target_heart_points,
                targetCalorieBurn: record.target_calorie_burn
            }
        });
    });
});

app.get('/api/health/groceries', (req, res) => {
    console.log("GROCERIES CALLED");
    
    res.json({
        success: true,
        groceries: [
            {
                item_name: "Test Item",
                calories: 100,
                sugar_g: 5,
                fat_g: 2,
                sodium_mg: 50,
                health_grade: "A",
                quantity: 1,
                unit: "pcs"
            }
        ]
    });
});

app.post("/increase-item", (req, res) => {
    if(!req.session.user) { return res.json({ success: false, message: "Login required" }); }
    const { id } = req.body;

    db.query(`SELECT * FROM grocery_items WHERE id = ? AND user_id = ?`, [id, req.session.user.id], (err, result) => {
        if(err || result.length === 0){ return res.json({ success: false, message: "Item not found" }); }
        const newQty = Number(result[0].quantity) + 1;
        db.query(`UPDATE grocery_items SET quantity = ? WHERE id = ?`, [newQty, id], (err2) => {
            if(err2){ return res.json({ success: false, message: "Increase failed" }); }
            return res.json({ success: true, message: "Quantity increased" });
        });
    });
});

// HEALTH INSIGHT ENGINE

app.get("/health-report", (req, res) => {
    if (!req.session.user) { return res.json([]); }
    const userId = req.session.user.id;

    const sql = `SELECT id, item_name, quantity, unit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade FROM grocery_items WHERE user_id = ?`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.json([]);

        const parsedReport = results.map(item => {
            const nameClean = item.item_name ? item.item_name.trim() : "Unknown Item";
            const lowerName = nameClean.toLowerCase();
            
            const isPersonalCare = lowerName.includes("shampoo") || lowerName.includes("hair oil") || lowerName.includes("keshking") || lowerName.includes("soap") || lowerName.includes("clear");                    
            const dictMatch = looseItemsDictionary[lowerName];

            const isScanned = item.calories > 0 || item.sugar_g > 0 || item.fat_g > 0 || item.sodium_mg > 0 || !!dictMatch;
            
            let status = "analyzing";
            let advisoryMessage = "No barcode data recorded yet. Scan the package to view its nutritional summary profile.";
            let grade = item.health_grade || "C";

            if (isPersonalCare) {
                status = "good";
                advisoryMessage = "Personal care item monitored. Safe for external household application tracking.";
            } else if (dictMatch) {
                status = dictMatch.status;
                advisoryMessage = dictMatch.advisory;
                grade = dictMatch.health_grade;
            } else if (isScanned) {
                if (Number(item.sugar_g) > 22 || grade === 'D' || grade === 'E') {
                    status = "high";
                    advisoryMessage = `⚠️ High Glycemic Alert! Contains ${item.sugar_g}g sugar per standard unit. Consume sparingly.`;
                } else if (lowerName.includes("oil") && grade === 'C') {
                    status = "high";
                    advisoryMessage = `⚠️ Lipids Watch! High volume oil tracking flag active. Keep dynamic consumption underneath family limits.`;
                } else {
                    status = "good";
                    advisoryMessage = `🎯 Balanced Selection! Health Grade (${grade}). Nutrients fall inside acceptable parameters.`;
                }
            }

            return {
                id: item.id,
                item_name: nameClean,
                quantity: Number(item.quantity || 0),
                unit: item.unit || "units",
                calories: dictMatch ? dictMatch.calories : (item.calories || 0),
                fat_g: dictMatch ? dictMatch.fat_g : (item.fat_g || 0),
                sugar_g: dictMatch ? dictMatch.sugar_g : (item.sugar_g || 0),
                protein_g: item.protein_g || 0,
                sodium_mg: dictMatch ? dictMatch.sodium_mg : (item.sodium_mg || 0),
                health_grade: grade,
                status: status,
                advisory: advisoryMessage
            };
        });
        res.json(parsedReport);
    });
});

app.get("/budget-report", async (req, res) => {
    if (!req.session.user) { return res.json([]); }
    const userId = req.session.user.id;

    const userItemsSql = `SELECT id, item_name, quantity, unit, price FROM grocery_items WHERE user_id = ?`;

    db.query(userItemsSql, [userId], async (err, userItems) => {
        if (err) return res.json([]);
        if (userItems.length === 0) return res.json([]);

        try {
            const finalReport = await Promise.all(userItems.map(async (userItem) => {
                const uName = String(userItem.item_name || "").toLowerCase().trim();
                const totalSpent = userItem.price ? Number(userItem.price) : 0;

                // Query Meilisearch for the best match instantly

                const searchResponse = await index.search(uName, { limit: 1 });
                const bestMatch = searchResponse.hits.length > 0 ? searchResponse.hits[0] : null;

                let status = "normal";
                let advisoryMessage = `No standard market data found for "${userItem.item_name}".`;
                let expectedPrice = 0;

                // FIX: Safe validation checking for your exact Meilisearch property payload

                if (bestMatch && bestMatch.price_inr !== undefined && bestMatch.price_inr !== null) {
                    const marketBasePrice = Number(bestMatch.price_inr);
                    
                    // Fallback cleanly to "1 units" if your database quantity_string formatting fails or is blank

                    const qtyString = bestMatch.quantity_string ? String(bestMatch.quantity_string).trim() : "1 units";
                    const matchQty = qtyString.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
                    
                    let marketBaseQty = 1;
                    let mUnit = "units";

                    if (matchQty) {
                        marketBaseQty = Number(matchQty[1]);
                        mUnit = matchQty[2].toLowerCase();
                    }

                    const uUnit = String(userItem.unit || "").toLowerCase().trim();
                    let userQtyInBase = Number(userItem.quantity || 0);
                    let marketQtyInBase = marketBaseQty;

                    // Standardize cross-metric weights

                    if (uUnit === "ml" || uUnit === "g") userQtyInBase /= 1000;
                    if (mUnit === "ml" || mUnit === "g") marketQtyInBase /= 1000;

                    // Calculate the optimal pricing parameters

                    expectedPrice = (marketBasePrice / marketQtyInBase) * userQtyInBase;

                    if (totalSpent === 0) {
                        status = "normal";
                        advisoryMessage = `Market reference price is ₹${Math.round(expectedPrice)}. Enter item expense to check savings!`;
                    } else {
                        const priceDiff = Math.abs(totalSpent - expectedPrice);

                        if (totalSpent > (expectedPrice + 2)) {
                            status = "high";
                            advisoryMessage = `⚠️ Overpaid alert! Market average price is around ₹${Math.round(expectedPrice)}. You paid ₹${Math.round(priceDiff)} extra.`;
                        } else if (totalSpent < (expectedPrice - 2)) {
                            status = "good";
                            advisoryMessage = `✅ Savings win! Market average cost was ₹${Math.round(expectedPrice)}. You saved ₹${Math.round(priceDiff)}!`;
                        } else {
                            status = "good";
                            advisoryMessage = `🎯 Standard rate match! (₹${Math.round(expectedPrice)})`;
                        }
                    }
                }

                return {
                    id: userItem.id,
                    item_name: userItem.item_name,
                    user_qty: Number(userItem.quantity || 0), 
                    user_unit: userItem.unit,
                    total_spent: totalSpent,
                    market_price: Math.round(expectedPrice),
                    status: status,
                    advisory: advisoryMessage
                };
            }));

            res.json(finalReport);
        } catch (searchErr) {
            console.error("Budget search mapping failure:", searchErr);
            res.status(500).json({ error: "Failed to compile smart budget engine details." });
        }
    });
});

app.get("/market-items-list", (req, res) => {
    db.query("SELECT DISTINCT item_name FROM market_prices ORDER BY item_name ASC", [], (err, results) => {
        if (err) return res.json([]);
        res.json(results.map(row => row.item_name));
    });
});

app.get("/monthly-trend", async (req, res) => {
    if (!req.session.user) return res.json([]);
    const userId = req.session.user.id;

    try {
        // 1. Get family size and user's items
        const [userRows] = await db.promise().query("SELECT family_size FROM users WHERE id = ?", [userId]);
        const familySize = userRows[0]?.family_size ? Number(userRows[0].family_size) : 4;

        const [items] = await db.promise().query(
            "SELECT item_name, SUM(quantity) AS total_qty, MAX(unit) AS unit FROM grocery_items WHERE user_id = ? GROUP BY item_name", 
            [userId]
        );

        // 2. Define Category Limits per person dynamically in code to avoid manual DB entry entirely!

       const globalLimits = {
        "oils": { limit: 1, unit: "L", keywords: ["oil", "ghee", "butter", "cooking spray", "margarine", "lard", "shortening", "coconut oil", "sunflower oil", 
            "rice bran oil", "olive oil", "canola oil", "avocado oil", "sesame oil", "peanut oil", "grapeseed oil", "flaxseed oil", "hemp oil", "walnut oil", 
            "safflower oil", "corn oil", "soybean oil", "vegetable oil", "palm oil", "cottonseed oil", "hazelnut oil", "macadamia oil", "pumpkin seed oil", 
            "almond oil", "argan oil", "camelina oil", "Keshking"] },
        
        "grains": { limit: 10, unit: "kg", keywords: ["rice", "atta", "flour", "wheat", "poha", "oats", "semolina", "rava", "cornmeal", "millet", "barley", 
            "quinoa", "bulgur", "couscous", "sorghum", "teff", "spelt", "farro", "freekeh", "kamut", "triticale", "rye", "buckwheat", "amaranth", "wild rice", 
            "black rice", "red rice", "brown rice", "white rice", "basmati", "sella", "parboiled", "idli rice", "matta rice", "poha", "flattened rice", 
            "oats", "rolled oats", "steel-cut oats", "instant oats", "semolina", "rava", "cornmeal", "millet", "barley", "quinoa", "bulgur", "couscous", "lays"] },

        "pulses": { limit: 2.5, unit: "kg", keywords: ["dal", "pulse", "chana", "gram", "mung", "toor", "urad", "masoor", "lentil", "kidney bean", "black bean", 
            "pigeon pea", "split pea", "soybean", "adzuki bean", "lupin bean", "fava bean", "navy bean", "cannellini bean", "black-eyed pea", "red lentil", 
            "green lentil", "yellow split pea"] },

        "sugar": { limit: 0.5, unit: "kg", keywords: ["sugar", "jaggery", "gur", "khandsari", "honey", "sweetener","corn syrup", "agave nectar", 
            "maple syrup", "stevia", "saccharin", "aspartame", "sucralose", "xylitol", "glucose", "lactose"] },

        "dairy": { limit: 7, unit: "L", keywords: ["milk", "curd", "paneer", "yogurt", "cheese", "ghee", "butter", "cream", "lassi","dahi"] },

        "vegetables": { limit: 12, unit: "kg", keywords: ["tomato", "potato", "onion", "spinach", "vegetable", "bhindi", "aloo", "gobi", 
            "carrot", "cabbage", "cauliflower", "beans", "peas", "eggplant", "brinjal", "cucumber", "zucchini", "lettuce", "kale","broccoli", 
            "bell pepper", "capsicum", "radish", "turnip", "beetroot", "pumpkin", "sweet potato", "corn", "mushroom", "asparagus", "artichoke", "leek", 
            "okra", "parsnip", "squash", "yam", "chili", "jalapeno", "scallion", "shallot", "watercress", "arugula", "endive", "fennel", "collard greens", 
            "mustard greens", "bok choy", "radicchio", "kohlrabi", "napa cabbage", "cabbage", "coriander leaves", "mint leaves", "fenugreek leaves"] },

        "fruits": { limit: 9, unit: "kg", keywords: ["apple", "banana", "orange", "mango", "fruit", "grapes", "papaya","watermelon","coconut",
            "pomegranate","guava","kiwi","strawberry","blueberry","pear","peach","lychee","cherry","avocado","fig","date","plum","apricot","melon",
            "raspberry","blackberry","citrus","lemon","lime","grapefruit","mandarin","tangerine","clementine","nectarine","passionfruit","dragonfruit",
            "starfruit","persimmon","cranberry","currant"] },
        "personal_care": { limit: 5, unit: "units", keywords: ["shampoo", "soap", "conditioner", "clear", "wash"] }
    };

        const reports = items.map(item => {
            const nameClean = String(item.item_name || "").trim();
            const lowerName = nameClean.toLowerCase();
            let total = Number(item.total_qty || 0);
            const userUnit = String(item.unit || "").toLowerCase().trim();

            // Normalize sub-units safely to base weights (g/ml to kg/L) to compare with limits

            if (userUnit === "g" || userUnit === "ml") {
                total = total / 1000;
            }

            // Automatically detect category based on keywords

            let detectedCategory = "Other";
            let limitConfig = null;

            for (const [catName, config] of Object.entries(globalLimits)) {
                if (config.keywords.some(keyword => lowerName.includes(keyword))) {
                    detectedCategory = catName;
                    limitConfig = config;
                    break;
                }
            }

            let status = "good";
            let advisory = "Within healthy recommended family size caps.";

            if (detectedCategory === "Other") {
                status = "analyzing";
                advisory = "General tracking baseline active.";
            } else if (limitConfig) {
                // Calculate scale limit dynamically: Baseline * Family Size

                const dynamicLimit = limitConfig.limit * familySize;
                const baseUnit = limitConfig.unit;

                if (total > dynamicLimit) {
                    status = "high";
                    advisory = `⚠️ Limit Exceeded! Your family consumed ${total.toFixed(1)}${baseUnit} of ${detectedCategory}. Safe ceiling cap is ${dynamicLimit}${baseUnit}.`;
                } else {
                    advisory = `🎯 Healthy consumption! Current: ${total.toFixed(1)}${baseUnit} / Cap: ${dynamicLimit}${baseUnit}.`;
                }
            }

            return {
                item_name: nameClean,
                total_qty: item.total_qty,
                unit: item.unit || "Units",
                status,
                advisory
            };
        });

        res.json(reports);

    } catch (err) {
        console.error("Trends auto-engine error:", err);
        res.json([]);
    }
});

app.post("/reset-purchase", (req, res) => {
    if(!req.session.user) return res.json({ success:false });
    db.query(`UPDATE grocery_items SET price = NULL WHERE user_id = ?`, [req.session.user.id], (err) => {
        res.json({ success: !err });
    });
});

app.post("/save-prices", (req, res) => {
    if(!req.session.user) return res.json({ success: false });
    const prices = req.body.prices;
    if(!prices || prices.length === 0) return res.json({ success: false });

    let completed = 0;
    prices.forEach(item => {
        db.query(`UPDATE grocery_items SET price = ? WHERE id = ? AND user_id = ?`, [item.price, item.id, req.session.user.id], (err) => {
            completed++;
            if(completed === prices.length) res.json({ success: true });
        });
    });
});

app.get("/items", (req, res) => {
    if(!req.session.user) return res.json([]);
    const sql = `SELECT grocery_items.*, item_categories.category FROM grocery_items LEFT JOIN item_categories ON grocery_items.item_name = item_categories.item_name WHERE grocery_items.user_id = ?`;
    db.query(sql, [req.session.user.id], (err, result) => {
        if(err) return res.json([]);
        res.json(result);
    });
});

app.delete("/delete-item/:id", (req, res) => {
    if(!req.session.user) return res.json({ success: false });
    db.query(`DELETE FROM grocery_items WHERE id = ? AND user_id = ?`, [req.params.id, req.session.user.id], (err) => {
        res.json({ success: !err });
    });
});

function syncMySQLToMeilisearch() {
    // Querying your new table schema (assuming your table name is market_prices)
    
    const query = "SELECT id, product_name, category, price_usd, price_inr, quantity FROM market_prices"; 

    db.query(query, async (err, results) => {
        if (err) {
            console.error("Error reading from MySQL during sync:", err);
            return;
        }

        if (results.length === 0) {
            console.log("⚠️ MySQL table is empty. Nothing to sync to Meilisearch Cloud.");
            return;
        }

        try {
            console.log(`Formatting ${results.length} items for Meilisearch Cloud...`);
            
            // Map your database fields cleanly into Meilisearch documents

            const documents = results.map(row => ({
                id: row.id, 
                product_name: row.product_name,
                category: row.category,
                price_usd: parseFloat(row.price_usd),
                price_inr: parseFloat(row.price_inr),
                quantity_string: row.quantity 
            }));

            const response = await index.addDocuments(documents);
            console.log("✅ Successfully synced your product dataset to Meilisearch Cloud!", response);
        } catch (error) {
            console.error("Failed to upload data to Meilisearch Cloud:", error);
        }
    });
}

syncMySQLToMeilisearch();

app.listen(3000, () => { console.log("Server running on port 3000"); });