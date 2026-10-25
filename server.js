const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); 
const session = require("express-session");
const { MeiliSearch } = require("meilisearch");
const cors = require("cors");

require('dotenv').config();

const app = express();


app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- SESSION PROFILES SYNCED FOR COOKIE HANDSHAKES ---
app.use(session({
    secret: process.env.SECRET_KEY || 'grocery_secret',
    resave: true,                
    saveUninitialized: true,     
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,           
        httpOnly: true,
        sameSite: 'lax'          
    }
}));

// --- LIVE DB CONNECTION ROUTED TO YOUR EXACT INSTANCE ---
const db = mysql.createConnection({
    host: 'localhost',             
    user: 'root',                  
    password: process.env.MYSQL_PASSWORD,
    database: 'grocery_ai_app' // 🎯 MATCHED: Directly uses your active local database
});

db.connect((err) => {
    if(err) {
        console.error("❌ MySQL Connection Mismatch Error:", err.message);
    } else {
        console.log("✅ MySQL Connected Successfully to database: [grocery_ai_app]");
    }
});

// Initialize Meilisearch Client
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY
});
const index = client.index('grocery_products');

// REAL-TIME MEILISEARCH AUTO-SUGGEST ENDPOINT
app.get("/suggest", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === "") return res.json([]);

        const searchResults = await index.search(query, { limit: 5 });
        const suggestions = searchResults.hits.map(hit => {
            return hit.product_name || hit.item_name || hit.name || hit.title || "";
        }).filter(item => item !== ""); 
        
        res.json(suggestions);
    } catch (error) {
        console.error("Meilisearch Query Error:", error);
        res.json([]); 
    }
});

// --- NODEMAILER TRANSPORTER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
transporter.verify((error) => {
    if (!error) console.log("🚀 SMTP Engine Status: READY");
});

// SMART DICTIONARY FOR LOOSE ITEMS
const looseItemsDictionary = {
    "apple": { calories: 52, sugar_g: 10, fat_g: 0.2, sodium_mg: 1, health_grade: "A", status: "good", advisory: "Excellent source of fiber and vitamin C." },
    "orange": { calories: 47, sugar_g: 9, fat_g: 0.1, sodium_mg: 0, health_grade: "A", status: "good", advisory: "Packed with Vitamin C and hydration." },
    "spinach": { calories: 23, sugar_g: 0.4, fat_g: 0.4, sodium_mg: 79, health_grade: "A", status: "good", advisory: "Superfood! Rich in iron and potassium." },
    "milk": { calories: 42, sugar_g: 5, fat_g: 1.0, sodium_mg: 44, health_grade: "B", status: "good", advisory: "Good source of calcium and protein." },
    "rice": { calories: 130, sugar_g: 0.1, fat_g: 0.3, sodium_mg: 1, health_grade: "C", status: "good", advisory: "Staple energy source." },
    "coconut oil": { calories: 862, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "Pure energy source, but 100% fat." },
    "sunflower oil": { calories: 884, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "High calorie cooking oil." },
    "rice rich oil": { calories: 884, sugar_g: 0, fat_g: 100, sodium_mg: 0, health_grade: "C", status: "high", advisory: "High calorie cooking oil matrix." }
};

// --- AUTHENTICATION ENDPOINTS ---

// SIGNUP
app.post("/signup", async (req, res) => {
    const { name, email, password, familySize } = req.body;
    if(!name || !email || !password) {
        return res.json({ success: false, message: "All fields required" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sizeOfFamily = Number(familySize) || 4;

        // 🎯 MATCHED: Column field updated from 'familySize' to 'family_size'
        const sql = `INSERT INTO users(name, email, password, family_size) VALUES (?, ?, ?, ?)`;
        db.query(sql, [name, email, hashedPassword, sizeOfFamily], (err) => {
            if(err){
                if(err.code === "ER_DUP_ENTRY") {
                    return res.json({ success: false, message: "Email or name is already taken." });
                }
                return res.json({ success: false, message: "Database registration error." });
            }
            return res.json({ success: true, message: "Signup successful!" });
        });
    } catch (e) {
        return res.json({ success: false, message: "Encryption failure." });
    }
});

// LOGIN
app.post("/login", (req, res) => {
    const { loginInput, password } = req.body;
    if(!loginInput || !password) {
        return res.json({ success: false, message: "Enter email/username and password" });
    }
    const sql = `SELECT * FROM users WHERE email = ? OR name = ?`;
    db.query(sql, [loginInput, loginInput], async (err, result) => {
        if(err || result.length === 0) {
            return res.json({ success: false, message: "User account profile not found" });
        }
        
        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            // 🎯 MATCHED: Pulls exact fields matching your schema properties
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                family_size: user.family_size || 4 
            };
            return res.json({ success: true, user: req.session.user });
        } else {
            return res.json({ success: false, message: "Wrong password" });
        }
    });
});

// PROFILE SESSIONS EXPOSURE ROUTE
app.get("/profile-data", (req, res) => {
    if(!req.session || !req.session.user){ return res.json({ loggedIn: false }); }
    
    const userId = req.session.user.id;
    const sql = `SELECT COUNT(*) AS totalItems FROM grocery_items WHERE user_id = ?`;
    db.query(sql, [userId], (err, result) => {
        res.json({
            loggedIn: true,
            name: req.session.user.name,
            email: req.session.user.email,
            totalItems: err ? 0 : result[0].totalItems
        });
    });
});

// LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// FORGOT PASSWORD
app.post("/forgot-password", (req, res) => {
    const { email } = req.body;
    const targetEmail = email ? email.trim().toLowerCase() : "";
    
    db.query(`SELECT * FROM users WHERE LOWER(TRIM(email)) = ?`, [targetEmail], (err, result) => {
        if (err || result.length === 0) return res.json({ success: false, message: "Email not found." });

        const user = result[0];
        const mailOptions = {
            from: '"Smart Grocery AI" <pushpasowjanya061@gmail.com>',
            to: targetEmail, 
            subject: 'Reset Your Password - Smart Grocery AI',
            html: `<p>Hello ${user.name}, click the link to reset your credentials:</p>
                   <a href="http://localhost:5173/reset-password?email=${encodeURIComponent(targetEmail)}">Change Password</a>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.json({ success: false, message: "Failed to dispatch recovery mail." });
            return res.json({ success: true, message: "Reset email sent successfully!" });
        });
    });
});

// UPDATE PASSWORD ACTION
app.post("/update-password-action", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Missing data fields." });

    try {
        const hashedNewPassword = await bcrypt.hash(password, 10);
        db.query(`UPDATE users SET password = ? WHERE email = ?`, [hashedNewPassword, email], (err) => {
            if (err) return res.json({ success: false, message: "Failed to update profile values." });
            return res.json({ success: true, message: "Password updated successfully!" });
        });
    } catch (error) {
        return res.json({ success: false, message: "Encryption system error." });
    }
});

// ADD GROCERY ITEM
app.post("/add-item", (req, res) => {
    if (!req.session || !req.session.user) return res.json({ success: false, message: "Login required" });

    let { 
        item_name, itemName, quantity, unit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade,
        packet_count, package_size, package_unit
    } = req.body;

    // Harmonize keys between frontend alternatives
    let finalItemName = (item_name || itemName || "").toLowerCase().trim();
    let finalQty = Number(quantity) || 1;
    let finalUnit = (unit || "kg").toLowerCase().trim();
    const userId = req.session.user.id;

    if (looseItemsDictionary[finalItemName] && (!calories || calories == 0)) {
        const dict = looseItemsDictionary[finalItemName];
        calories = dict.calories;
        fat_g = dict.fat_g;
        sugar_g = dict.sugar_g;
        protein_g = dict.protein_g || 0;
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

    // 🎯 MATCHED: Checked columns inside 'grocery_items' schema (item_name, user_id)
    const checkSql = `SELECT id, quantity, packet_count FROM grocery_items WHERE user_id = ? AND item_name = ? AND unit = ?`;
    db.query(checkSql, [userId, finalItemName, finalUnit], (err, result) => {
        if (err) return res.json({ success: false, message: "DB Error check logic." });

        if (result.length > 0) {
            const existing = result[0];
            const newQty = finalQty; 
            const newPackageCount = existing.packet_count ? (Number(existing.packet_count) + (Number(packet_count) || 0)) : packet_count;
            db.query(
                `UPDATE grocery_items SET quantity = ?, packet_count = ? WHERE id = ?`,
                [newQty, newPackageCount, existing.id],
                (err2) => {
                    if (err2) return res.json({ success: false, message: "Update failed" });
                    return res.json({ success: true, message: "Quantity updated successfully." });
                }
            );
        }else {
            // 🎯 MATCHED: purchase_date is skipped from columns because your DB inserts curdate() by default
            const insertSql = `
                INSERT INTO grocery_items 
                (user_id, item_name, quantity, unit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade, packet_count, package_size, package_unit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(
                insertSql,
                [userId, finalItemName, finalQty, finalUnit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade, packet_count || null, package_size || null, package_unit || null],
                (err3) => {
                    if (err3) {
                        console.error("SQL Insertion Failure detail:", err3);
                        return res.json({ success: false, message: "Insert inventory row failed" });
                    }
                    return res.json({ success: true, message: "Item saved successfully" });
                }
            );
        }
    });
});

// GET ITEMS
app.get("/items", (req, res) => {
    if(!req.session || !req.session.user) return res.json([]);
    // 🎯 MATCHED: Fetches rows referencing your live table context fields
    db.query(`SELECT * FROM grocery_items WHERE user_id = ?`, [req.session.user.id], (err, result) => {
        if(err) return res.json([]);
        res.json(result);
    });
});

// SAVE USER VITALS
app.post("/save-vitals", (req, res) => {
    if (!req.session || !req.session.user) return res.json({ success: false, message: "Login required" });
    const userId = req.session.user.id;
    const { age, weight, height, goal } = req.body;

    if (!age || !weight || !height || !goal) return res.json({ success: false, message: "Missing tracking variables" });

    // 🎯 MATCHED: Configured column values to read 'weight_kg', 'height_cm', and 'health_goal'
    db.query(`UPDATE users SET age = ?, weight_kg = ?, height_cm = ?, health_goal = ? WHERE id = ?`, 
        [Number(age), Number(weight), Number(height), goal, userId], (err) => {
        if (err) return res.json({ success: false, message: "Database vitals save failure." });
        return res.json({ success: true, message: "Vitals updated successfully!" });
    });
});

// GET USER VITALS
app.get("/get-vitals", (req, res) => {
    if (!req.session || !req.session.user) return res.json({ success: false, loggedIn: false });
    // 🎯 MATCHED: Formatted selection keys to match table columns exactly
    db.query(`SELECT age, weight_kg as weight, height_cm as height, health_goal as goal FROM users WHERE id = ?`, 
        [req.session.user.id], (err, result) => {
        if (err) return res.json({ success: false });
        if (result.length > 0 && result[0].age !== null) {
            return res.json({ success: true, loggedIn: true, data: result[0] });
        }
        return res.json({ success: false, loggedIn: true, message: "No vitals configured yet." });
    });
});

// DECREASE ITEM
app.post("/decrease-item", (req, res) => {
    if(!req.session || !req.session.user) return res.json({ success: false, message: "Login required" });
    const { id, amount } = req.body;
    const decAmount = Number(amount || 1);

    db.query(`SELECT * FROM grocery_items WHERE id = ? AND user_id = ?`, [id, req.session.user.id], (err, result) => {
        if(err || result.length === 0) return res.json({ success: false });
        const item = result[0];
        const newQty = Number(item.quantity) - decAmount;

        if(newQty <= 0){
            db.query(`DELETE FROM grocery_items WHERE id = ?`, [id], () => res.json({ success: true, message: "Item removed" }));
        } else {
            db.query(`UPDATE grocery_items SET quantity = ? WHERE id = ?`, [newQty, id], () => res.json({ success: true, message: "Quantity decreased" }));
        }
    });
});

// INCREASE ITEM
app.post("/increase-item", (req, res) => {
    if(!req.session || !req.session.user) return res.json({ success: false, message: "Login required" });
    const { id } = req.body;
    db.query(`SELECT * FROM grocery_items WHERE id = ? AND user_id = ?`, [id, req.session.user.id], (err, result) => {
        if(err || result.length === 0) return res.json({ success: false });
        const currentQty = parseFloat(result[0].quantity) || 0;
        
        db.query(`UPDATE grocery_items SET quantity = ? WHERE id = ?`, [currentQty + 1, id], () => res.json({ success: true }));
    });
});

// DELETE ITEM REMOVAL HANDLER
app.delete("/delete-item/:id", (req, res) => {
    if(!req.session || !req.session.user) return res.json({ success: false });
    db.query(`DELETE FROM grocery_items WHERE id = ? AND user_id = ?`, [req.params.id, req.session.user.id], (err) => {
        res.json({ success: !err });
    });
});

// HEALTH INSIGHT ENGINE
app.get("/health-report", (req, res) => {
    if (!req.session || !req.session.user) return res.json([]);
    db.query(`SELECT id, item_name, quantity, unit, calories, fat_g, sugar_g, protein_g, sodium_mg, health_grade FROM grocery_items WHERE user_id = ?`, [req.session.user.id], (err, results) => {
        if (err) return res.json([]);

        const parsedReport = results.map(item => {
            const nameClean = item.item_name ? item.item_name.trim() : "Unknown Item";
            const lowerName = nameClean.toLowerCase();
            const isPersonalCare = lowerName.includes("shampoo") || lowerName.includes("hair oil") || lowerName.includes("keshking") || lowerName.includes("soap") || lowerName.includes("clear");                    
            const dictMatch = looseItemsDictionary[lowerName];
            const isScanned = item.calories > 0 || item.sugar_g > 0 || item.fat_g > 0 || item.sodium_mg > 0 || !!dictMatch;
            
            let status = "analyzing";
            let advisoryMessage = "No barcode data recorded yet.";
            let grade = item.health_grade || "C";

            if (isPersonalCare) {
                status = "good";
                advisoryMessage = "Personal care item monitored.";
            } else if (dictMatch) {
                status = dictMatch.status;
                advisoryMessage = dictMatch.advisory;
                grade = dictMatch.health_grade;
            } else if (isScanned) {
                if (Number(item.sugar_g) > 22 || grade === 'D' || grade === 'E') {
                    status = "high";
                    advisoryMessage = `⚠️ High Glycemic Alert! Contains ${item.sugar_g}g sugar.`;
                } else if (lowerName.includes("oil") && grade === 'C') {
                    status = "high";
                    advisoryMessage = `⚠️ Lipids Watch! High volume oil tracking flag active.`;
                } else {
                    status = "good";
                    advisoryMessage = `🎯 Balanced Selection! Health Grade (${grade}).`;
                }
            }

            return {
                id: item.id, item_name: nameClean, quantity: Number(item.quantity || 0), unit: item.unit || "units",
                calories: dictMatch ? dictMatch.calories : (item.calories || 0),
                fat_g: dictMatch ? dictMatch.fat_g : (item.fat_g || 0),
                sugar_g: dictMatch ? dictMatch.sugar_g : (item.sugar_g || 0),
                protein_g: item.protein_g || 0, sodium_mg: dictMatch ? dictMatch.sodium_mg : (item.sodium_mg || 0),
                health_grade: grade, status: status, advisory: advisoryMessage
            };
        });
        res.json(parsedReport);
    });
});

app.get("/budget-report", async (req, res) => {
    if (!req.session || !req.session.user) return res.json([]);

    // Fallback dictionary for common items
    const priceFallback = {
        "milk": 60,
        "sunflower oil": 150,
        "rice rich oil": 160,
        "spinach": 40,
        "almond drops hair oil": 120,
        "clear shampoo": 200,
        "lays": 20,
        "rice": 70
    };

    // 1. Fetch user items
    db.query(`SELECT id, item_name, quantity, unit, price FROM grocery_items WHERE user_id = ?`, 
    [req.session.user.id], (err, userItems) => {
        if (err || !userItems) return res.json([]);

        // 2. Fetch all market prices
        db.query(`SELECT product_name, price_inr FROM market_prices`, (err, marketPrices) => {
            if (err) marketPrices = []; // If DB fails, rely on fallback only

            const finalReport = userItems.map((userItem) => {
                const uName = String(userItem.item_name || "").toLowerCase().trim();
                const totalSpent = Number(userItem.price || 0);

                // 3. Match from Database (with safety check)
                let match = marketPrices.find(mp => {
                    const mName = String(mp.product_name || "").toLowerCase().trim();
                    return uName.includes(mName) || mName.includes(uName);
                });

                // 4. Determine market price (DB match takes priority)
                let marketPrice = match ? Number(match.price_inr) : (priceFallback[uName] || 0);

                // 5. Logic
                let status = "normal";
                let advisoryMessage = marketPrice > 0 ? "" : `No market benchmark found for "${userItem.item_name}".`;

                if (marketPrice > 0) {
                    if (totalSpent === 0) {
                        status = "fair";
                        advisoryMessage = `📊 Market Benchmark: ₹${Math.round(marketPrice)}. (Update purchase price!)`;
                    } else {
                        const priceDiff = Math.abs(totalSpent - marketPrice);
                        // Comparison logic
                        if (totalSpent > (marketPrice + 2)) {
                            status = "high";
                            advisoryMessage = `⚠️ Overpaid! Market price is ₹${Math.round(marketPrice)}. You paid ₹${Math.round(priceDiff)} extra.`;
                        } else if (totalSpent < (marketPrice - 2) && totalSpent > 0) {
                            status = "good";
                            advisoryMessage = `✅ Great Deal! Saved ₹${Math.round(priceDiff)} vs market price.`;
                        } else {
                            status = "fair";
                            advisoryMessage = `🎯 Fair Price! Matches local benchmarks.`;
                        }
                    }
                }

                // Return explicit values to the frontend
                return {
                    id: userItem.id,
                    item_name: userItem.item_name,
                    user_qty: Number(userItem.quantity || 0),
                    user_unit: userItem.unit,
                    total_spent: totalSpent,
                    market_price: parseInt(marketPrice), 
                    status: status,
                    advisory: advisoryMessage
                };
            });

            res.json(finalReport);
        });
    });
});

// MONTHLY TREND & CATEGORY LIMIT ENGINE
app.get("/monthly-trend", async (req, res) => {
    if (!req.session || !req.session.user) return res.json([]);
    const userId = req.session.user.id;

    try {
        const [userRows] = await db.promise().query("SELECT family_size FROM users WHERE id = ?", [userId]);
        const familySize = userRows[0]?.family_size ? Number(userRows[0].family_size) : 4;

        // Group by item name to get total quantities
        const [items] = await db.promise().query(
            "SELECT item_name, SUM(quantity) AS total_qty, MAX(unit) AS unit FROM grocery_items WHERE user_id = ? GROUP BY item_name", 
            [userId]
        );

        const globalLimits = {
            "oils": { limit: 1, unit: "L", keywords: ["oil", "ghee", "butter"] },
            "dairy": { limit: 7, unit: "L", keywords: ["milk"] },
            // Add other categories...
        };

        const reports = items.map(item => {
            const nameClean = String(item.item_name || "").trim();
            let total = Number(item.total_qty || 0);
            
            // Logic to find category
            let limitConfig = { limit: 10, unit: "units" }; // Default
            for (const [cat, cfg] of Object.entries(globalLimits)) {
                if (cfg.keywords.some(k => nameClean.toLowerCase().includes(k))) {
                    limitConfig = cfg;
                    break;
                }
            }

            const dynamicLimit = limitConfig.limit * familySize;
            const status = total > dynamicLimit ? "high" : "healthy";

            return {
                item_name: nameClean,
                total_qty: total,
                unit: limitConfig.unit,
                dynamic_limit: dynamicLimit,
                status: status,
                advisory: `Current: ${total}${limitConfig.unit} / Cap: ${dynamicLimit}${limitConfig.unit}`
            };
        });

        res.json(reports);
    } catch (err) {
        res.json([]);
    }
});

app.post("/reset-purchase", (req, res) => {
    if(!req.session || !req.session.user) return res.json({ success:false });
    db.query(`UPDATE grocery_items SET price = NULL WHERE user_id = ?`, [req.session.user.id], (err) => {
        res.json({ success: !err });
    });
});

app.post("/save-prices", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success: false });
    const { prices } = req.body; 
    if (!prices) return res.json({ success: false });

    try {
        // Filter out items that don't need an update (optional but safer)
        const updatePromises = prices.map(item => {
            return new Promise((resolve, reject) => {
                // Update only if the price is provided
                db.query(
                    `UPDATE grocery_items SET price = ? WHERE id = ? AND user_id = ?`, 
                    [item.price, item.id, req.session.user.id], 
                    (err) => err ? reject(err) : resolve()
                );
            });
        });

        await Promise.all(updatePromises);
        res.json({ success: true });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => { console.log("🚀 Server cleanly running on local port 3000"); });