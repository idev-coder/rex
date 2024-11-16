import proto from './application'
import req from './request'
import res from './response'
import express from 'express'

export { json, raw, static, text, urlencoded, Router } from 'express'


export const application = proto
export const request = req
export const response = res

export const createServer = express