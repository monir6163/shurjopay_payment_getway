import dbConnect from "@/lib/db";
import Order from "@/models/order";
import shurjopayPayment from "shurjopay";

const shurjopay = shurjopayPayment();

shurjopay.config(
    "https://sandbox.shurjopayment.com",
    "sp_sandbox",
    "pyyk97hu&6u6",
    "SP",
    `${process.env.BASE_URL}/api/Order/verify`
);

//sp_code = 1000 == success
//sp_code = 1001 == pending

export default async function handler(req, res) {
    await dbConnect();
    const { method } = req;
    switch (method) {
        case "GET":
            try {
                const { page, size } = req.query;
                const limit = size ? +size : 10;
                const skip = page ? page * limit : 0;
                const count = await Order.countDocuments({});
                const orders = await Order.find({})
                    .limit(limit)
                    .skip(skip)
                    .sort({ createdAt: -1 });
                if (orders) {
                    res.status(200).json({
                        success: true,
                        data: orders,
                        count,
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: "No Orders Found",
                    });
                }
            } catch (error) {
                console.log(error);
                res.status(502).json({
                    success: false,
                    message: "bad gateway",
                });
            }
            break;
        case "POST":
            try {
                let orderNumber = Math.floor(
                    Math.random() * 1000000000
                ).toString();
                const {
                    fullName,
                    email,
                    phone,
                    productId,
                    productName,
                    productPrice,
                } = req.body;

                if (!fullName || !email || !phone) {
                    return res.status(400).json({
                        success: false,
                        message: "Please Provide All Fields",
                    });
                }

                shurjopay.makePayment(
                    {
                        amount: productPrice,
                        currency: "BDT",
                        product_name: productName,
                        product_id: productId,
                        order_id: orderNumber,
                        customer_name: fullName,
                        customer_address: "Dhaka",
                        client_ip: "192.18. 1. 1",
                        customer_phone: phone,
                        customer_email: email,
                        customer_city: "Dhaka",
                        customer_post_code: "1229",
                    },
                    (response_data) => {
                        res.status(200).json({
                            success: true,
                            data: response_data,
                        });
                    },
                    (error) => {
                        res.status(400).json({
                            success: false,
                            message: error,
                        });
                    }
                );
            } catch (error) {
                console.log(error);
                res.status(502).json({
                    success: false,
                    message: error.message,
                });
            }
            break;
        default:
            res.status(500).json({ success: false, message: "Invalid Method" });
    }
}
