import dbConnect from "@/lib/db";
import Order from "@/models/order";
import shurjopayPayment from "shurjopay";

import { adminMailOptions, transporter } from "@/lib/nodemailer";
import ThankSection from "@/models/thankyou";

const shurjopay = shurjopayPayment();

shurjopay.config(
    "https://sandbox.shurjopayment.com",
    "sp_sandbox",
    "pyyk97hu&6u6",
    "SP",
    `${process.env.BASE_URL}/thank-you`
);

export default async function handler(req, res) {
    await dbConnect();
    const { method } = req;
    switch (method) {
        case "GET":
            try {
                const { order_id } = req.query;
                const fbgruopLink = await ThankSection.find({});
                let fbLink = fbgruopLink[0].buttonLink;

                shurjopay.verifyPayment(order_id, async function (response) {
                    if (response[0].sp_code === "1000") {
                        response[0].is_verify = 1;
                        const order = await Order.create({
                            fullName: response[0].name,
                            email: response[0].email,
                            phone: response[0].phone_no,
                            customer_order_id: response[0].customer_order_id,
                            invoice_no: response[0].invoice_no,
                            order_id: response[0].order_id,
                            amount: response[0].amount,
                            is_verify: response[0].is_verify,
                        });

                        const savedOrder = await order.save();
                        const userMailOptions = {
                            from: process.env.EMAIL,
                            to: response[0].email,
                            subject:
                                "Congratulations Your Order Placed Successfully",
                            html: `<!DOCTYPE html>
                    <html>
                        <head>
                            <style>
                                table {
                                    font-family: arial, sans-serif;
                                    border-collapse: collapse;
                                    width: 100%;
                                }
                    
                                td,
                                th {
                                    border: 1px solid #dddddd;
                                    text-align: left;
                                    padding: 8px;
                                }
                    
                                tr:nth-child(even) {
                                    background-color: #dddddd;
                                }
                            </style>
                        </head>
                        <body>
                            <p>
                            Thank you for your order! We have received your order
                        and it is being processed. You can find the details of
                        your order below: <b>Order Number: ${
                            response[0].order_id
                        }</b>
                            </p>
                    
                            <table>
                                <tr>
                                    <td>
                                        Full Name:
                                    </td>
                                    <td>
                                        ${response[0].name}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Email:
                                    </td>
                                    <td>
                                        ${response[0].email}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Phone Number:
                                    </td>
                                    <td>
                                    ${response[0].phone_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Payment Status:
                                    </td>
                                    <td>
                                    ${
                                        response[0].is_verify === 1
                                            ? "Paid"
                                            : "Unpaid"
                                    }
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Join Facebook Group:
                                    </td>
                                    <td>
                                    <a style="text-decoration:underline" href="${fbLink}">Join Facebook Group</a>
                                    </td>
                                </tr>
                                
                            </table>
                        </body>
                    </html>
                    
                    `,
                        };
                        await transporter.sendMail(userMailOptions);
                        await transporter.sendMail({
                            ...adminMailOptions,
                            subject: "New Order Placed",
                            html: `<!DOCTYPE html>
                    <html>
                        <head>
                            <style>
                                table {
                                    font-family: arial, sans-serif;
                                    border-collapse: collapse;
                                    width: 100%;
                                }
                    
                                td,
                                th {
                                    border: 1px solid #dddddd;
                                    text-align: left;
                                    padding: 8px;
                                }
                    
                                tr:nth-child(even) {
                                    background-color: #dddddd;
                                }
                            </style>
                        </head>
                        <body>
                            <p>
                            Thank you for your order! We have received your order
                        and it is being processed. You can find the details of
                        your order below: <b>Order Number: ${
                            response[0].order_id
                        }</b>
                            </p>
                    
                            <table>
                                <tr>
                                    <td>
                                        Full Name:
                                    </td>
                                    <td>
                                        ${response[0].name}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Email:
                                    </td>
                                    <td>
                                        ${response[0].email}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Phone Number:
                                    </td>
                                    <td>
                                    ${response[0].phone_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Payment Status:
                                    </td>
                                    <td>
                                    ${
                                        response[0].is_verify === 1
                                            ? "Paid"
                                            : "Unpaid"
                                    }
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Join Facebook Group:
                                    </td>
                                    <td>
                                    <a style="text-decoration:underline" href="${fbLink}">Join Facebook Group</a>
                                    </td>
                                </tr>
                                
                            </table>
                        </body>
                    </html>
                    
                    `,
                        });
                        if (savedOrder) {
                            console.log("savedOrder", savedOrder);
                            if (savedOrder.is_verify === 1) {
                                res.redirect(
                                    `/thank-you?order_id=${savedOrder.order_id}&amount=${savedOrder.amount}&status=${savedOrder.is_verify}&name=${savedOrder.fullName}&email=${savedOrder.email}&phone=${savedOrder.phone}`
                                );
                                res.status(200).json({
                                    success: true,
                                    message: "Order Placed Successfully",
                                });
                            }
                        } else {
                            res.status(400).json({
                                success: false,
                                message: "Order Not Placed",
                            });
                        }
                    } else {
                        res.status(400).json({
                            success: false,
                            error: "Payment verification failed.",
                        });
                    }
                });
            } catch (error) {
                res.status(400).json({ success: false, error });
            }
    }
}
