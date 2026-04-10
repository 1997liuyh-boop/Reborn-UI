import { z } from 'zod'

export interface Contact {
    name: string
    phone: string
    email: string
    no: number
}

export interface FormData {
    username: string
    gender: number | undefined
    password: string
    newPassword: string
    email: string
    age: number | undefined
    bio: string
    interest: string[]
    contacts: Contact[]
    isAgree: boolean
    height: number
    weight: number
    birthday: string
    dateRange: string[]
}

export const genderOptions = [
    { label: '未知', value: 0 },
    { label: '男', value: 1 },
    { label: '女', value: 2 },
]

export const initialForm: FormData = {
    username: '乐一番',
    gender: 1,
    password: 'aA123456789!',
    newPassword: 'aA1234562789!',
    email: '1114321@qq.com',
    age: 18,
    bio: '',
    height: 180,
    weight: 70,
    birthday: '2000-01-01',
    dateRange: [],
    interest: [],
    contacts: [],
    isAgree: false,
}

const emailRule = z.string().email('邮箱格式不正确').refine(val => val.endsWith('@qq.com') || val.endsWith('@163.com'), '仅支持 QQ 或 163 邮箱')
const phoneSchema = z.string()
    .min(11, { message: '手机号长度不足' })
    .max(11, { message: '手机号长度超出' })
    .regex(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
const passwordSchema = z.string().min(8, '密码至少8位').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, '需包含大小写字母和特殊符号')

export const createRules = (form: FormData) => z.object({
    username: z.string().min(3, '用户名至少3个字符'),
    password: passwordSchema,
    newPassword: passwordSchema.refine(val => val !== form.password, '新密码不能与旧密码相同'),
    gender: z.preprocess(
        (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
        z.number({ message: '请选择性别' })
            .refine((n) => [0, 1, 2].includes(n), '请选择性别'),
    ),
    email: emailRule,
    age: z.number()
        .min(18, { message: '年龄最小不能小于 18 岁' })
        .max(100, { message: '年龄最大不能超过 100 岁' }),
    height: z.number()
        .min(160, { message: '身高不能小于160cm' })
        .max(190, { message: '身高不能大于190cm' }),
    weight: z.number()
        .min(50, { message: '体重不能小于50kg' })
        .max(100, { message: '体重不能大于100kg' }),
    birthday: z.string().min(1, '请选择出生年月'),
    dateRange: z.array(z.string()).length(2, '请选择完整的时间范围'),
    interest: z.array(z.string()).min(1, '请至少选择一项兴趣爱好'),
    isAgree: z.literal(true, {
        message: '请同意协议',
    }),
    bio: z.string().min(10, '简介至少10个字符').optional().or(z.literal('')),
    contacts: z.array(z.object({
        name: z.string().min(2, 'Name 最少两个字符'),
        phone: phoneSchema,
        email: emailRule,
        no: z.coerce.number().min(1, '序号最小不能小于 1'),
    }))
        .min(3, '联系人至少需要3个')
        .refine((items) => {
            for (let i = 1; i < items.length; i++) {
                if (items[i].no <= items[i - 1].no) {
                    return false
                }
            }
            return true
        }, {
            message: '排序必须是递增的',
        }),
})
