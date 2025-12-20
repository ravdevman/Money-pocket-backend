const express = require('express');
const { sequelize } = require('./src/config/database');
const Bank = require('./src/models/bank');
const Bill = require('./src/models/bill');
const Activity = require('./src/models/activity');
const { STATUS } = require('./src/constants/bill-const');
const { Op } = require('sequelize');

const app = express();
app.use(express.json());
const port = 3000;

const models = {
  Bill,
  Activity,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// activity

app.get('/all-activities', async (req, res) => {
    let months = [new Date()];

    for (let i = 0; i < 5; i++) {
        let previousMonth = new Date(months[i]);
        previousMonth.setDate(0);
        months.push(previousMonth);
    }

    const history = []; 
    for (let month of months) {
        var startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        var endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const activities = await Activity.findAll({
        order:  [['id', 'DESC']],
            where: {
                createdAt : {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

         const activitiesCount = await Activity.sum('amount' ,{
            where: {
                createdAt : {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        history.push({ 
            month,
            total_amount: activitiesCount || 0,
            activities
        })
    }

    
    res.status(200).send(history);
});

app.get('/activities', async (req, res) => {
    const activities = await Activity.findAll({
        order:  [['id', 'DESC']],
        limit: 3
    });
    if (!activities) {
        res.status(404).send('not found')
    }
    res.status(200).send(activities);
});

app.post('/activity', async (req, res) => {
    const {title, amount, isDeduct} = req.body;

    const activity = Activity.create({
        title: title,
        amount: amount
    });

    if (isDeduct) {
        const bank = await Bank.findOne();
        if (!bank) {
            res.status(404).send('bank not found')
        }
        bank.secondary_amount = Number(bank.secondary_amount) - Number(amount);
        bank.save();
    }

    res.status(200).send(activity);
});


// bills
app.get('/bills-count', async (req, res) => {
    const totalBills = await Bill.count();
    const paidBills = await Bill.count({
        where: {
            status: STATUS.PAID
        }
    });
    const sumBills = await Bill.sum('price');

    if (!totalBills) {
        res.status(404).send('not found')
    }

    res.status(200).send({total_bills: totalBills, paid_bills: paidBills, sum_bills: sumBills});
});

app.get('/bills', async (req, res) => {
    var date = new Date();
    var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const bills = await Bill.findAll({
        order:  [['id', 'ASC']],
        include: {
            model: Activity,
            as: 'activities',
            required: false,
            where: {
                isBillPayment: true,
                createdAt : {
                    [Op.between]: [startDate, endDate]
                }
            }
        }
    });
    if (!bills) {
        res.status(404).send('not found')
    }
    res.status(200).send(bills);
});

app.post('/bill', async (req, res) => {
    const {name, frequency, price} = req.body;
    const bill = Bill.create({
        name: name,
        status: STATUS.PENDING,
        frequency: frequency,
        price: price
    });
    res.status(200).send(bill);
});

app.put('/bill-status', async (req, res) => {
    const {status, id} = req.body;
    const bill = await Bill.findByPk(id)
    if (!bill) {
        res.status(404).send('not found')
    }
    if (bill.status == STATUS.PENDING && status == STATUS.PENDING) {
        await bill.destroy();
        res.status(200).send("removed");
    }

    var date = new Date();
    var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const existingActivity = await Activity.findOne({
        where: {
            bill_id: bill.id,
            isBillPayment: true,
            createdAt : {
                [Op.between]: [startDate, endDate]
            }
        }
    })

    if (status == STATUS.PAID) {
        if (!existingActivity) {
            await Activity.create({
                title: "Facture: " + bill.name,
                amount: bill.price,
                isBillPayment: true,
                bill_id: bill.id
            })
        } else {
            res.status(200).send("Bill paid");
        }
    } else if (status == STATUS.PENDING) {
        if (existingActivity) {
            await existingActivity.destroy()
        }
    }
    await bill.update({
        status
    });
    res.status(200).send(bill);
});

// acount management
app.get('/bank', async (req, res) => {
    const bank = await Bank.findOne();
    if (!bank) {
        res.status(404).send('not found')
    }
    res.status(200).send({today_date: Date.now() ,...bank.dataValues});
});

app.put('/saving', async (req, res) => {
    const {amount, savingFor} = req.body;
    const bank = await Bank.findOne();
    if (!bank) {
        res.status(404).send('not found')
    }
    bank.saving_amount = amount;
    bank.saving_for = savingFor;
    await bank.save()
    res.status(200).send(bank);
});

app.put('/primary', async (req, res) => {
    const {amount} = req.body;
    const bank = await Bank.findOne();
    if (!bank) {
        res.status(404).send('not found')
    }
    bank.primary_amount = amount;
    await bank.save();
    res.status(200).send(bank);
});

app.put('/secondary', async (req, res) => {
    const {amount} = req.body;
    const bank = await Bank.findOne();
    if (!bank) {
        res.status(404).send('not found')
    }
    bank.secondary_amount = amount;
    await bank.save();
    res.status(200).send(bank);
});


app.listen(port, async () => {
    console.log(`Express server listening at http://localhost:${port}`);
    try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: false });
    console.log('All models were synchronized successfully.');
    } catch (error) {
    console.error('Unable to connect to the database:', error);
    }
});