const User = require('../services/user')
const {Router} = require('express')
const {body,validationResult} = require('express-validator')
const crypto = require('crypto')
const asyncHandler = require('express-async-handler')
const Email = require('../services/email')
const router = new Router();
router.get('/',function isRegister(req,res){
    res.render('register')
});
router.post('/',[
    body('email')
        .isEmail()
        .normalizeEmail()
        .custom(async function(email){
            const found = await User.findUserByEmail(email);
            if(found){
                throw Error('User exists')
            }
            return true;
        }),
    body('displayName')
        .trim()
        .notEmpty(),
    body('password')
        .isLength({min:6})
        .notEmpty(),
],asyncHandler(async function Register(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('register',{errors:errors.array()});
    }
    const user = await User.create({
        email:req.body.email,
        displayName:req.body.displayName,
        password:User.hassPassword(req.body.password),
        token: crypto.randomBytes(3).toString('hex').toUpperCase(),
    })
    await Email.send(user.email,'Mã kích hoạt tài khoản',`link activate của bạn là : ${process.env.BASE_URL}/login/${user.id}/${user.token}`)
    res.redirect('/login')
}));
module.exports = router;