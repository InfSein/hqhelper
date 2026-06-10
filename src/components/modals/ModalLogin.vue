<script setup lang="ts">
import {
  LogInOutlined, PersonAddAlt1Filled, LockResetOutlined,
  AccountCircleOutlined, KeyOutlined,
  EmailOutlined, VerifiedUserFilled,
  PersonOutlineOutlined, BadgeFilled,
  EditNoteOutlined, LabelImportantFilled, FaceRetouchingNaturalFilled,
  DoneOutlined,
} from '@vicons/material'
import ModalNbbAvatarSelector from './ModalNbbAvatarSelector.vue'
import { useStore } from '@/store'
import type { NbbResponse, ResdataRegisterAndLogin } from '@/types/api/nbb-cloud.ts'
import { deepCopy } from '@/tools'
import { getImgCdnUrl } from '@/tools/item'
import { useNbbCloud } from '@/tools/nbb-cloud'

const t = inject<(message: string, args?: any) => string>('t')!
const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const {
  sendVerify, sendVerifyForResetPassword,
  register, login, resetPassword,
  resolveUserInfo,
  resetNickNameAndTitle, resetAvatar,
} = useNbbCloud()

const showModal = defineModel<boolean>('show', { required: true })

interface ModalLoginProps {
  defaultTab: "login" | "register" | "edituser"
}
const props = defineProps<ModalLoginProps>()

const loginAction = ref<"login" | "register" | "resetpass" | "edituser">('login')
const verifyCooldown = ref(0)
const isVerifyCooldown = ref(false)
const isSendingVerify = ref(false)
const isSubmitting = ref(false)
const showNbbAvatarSelector = ref(false)
const loginFormData = reactive({
  account: '',
  password: '',
})
const registerFormData = reactive({
  email: '',
  nickname: '',
  loginname: '',
  password: '',
  verifycode: '',
})
const resetpassFormData = reactive({
  email: '',
  password: '',
  verifycode: '',
})
const edituserFormData = reactive({
  nickname: '',
  title: '',
  avatar: 0,
})

const onLoad = () => {
  loginAction.value = props.defaultTab
  edituserFormData.nickname = store.cloudConfig.nbb_account_nickname
  edituserFormData.title = store.cloudConfig.nbb_account_title
  edituserFormData.avatar = store.cloudConfig.nbb_account_avatar
}

const modalIcon = computed(() => {
  switch (loginAction.value) {
    case 'resetpass': return LockResetOutlined
    case 'register': return PersonAddAlt1Filled
    case 'edituser': return EditNoteOutlined
    case 'login': 
    default: return LogInOutlined
  }
})
const modalTitle = computed(() => {
  switch (loginAction.value) {
    case 'resetpass': return t('cloud.text.reset_password')
    case 'register': return t('common.register')
    case 'edituser': return t('cloud.text.edit_account_info')
    case 'login': 
    default: return t('common.login')
  }
})

const verifyButtonText = computed(() =>
  isVerifyCooldown.value ? t('cloud.message.verify_cooldown', verifyCooldown.value) : t('cloud.text.send_verify')
)
const avatarUrl = computed(() => {
  const avatarId = edituserFormData.avatar || 64384
  return getImgCdnUrl(avatarId)
})

const startCooldown = (seconds: number) => {
  verifyCooldown.value = seconds
  isVerifyCooldown.value = true

  const timer = setInterval(() => {
    verifyCooldown.value--
    if (verifyCooldown.value <= 0) {
      clearInterval(timer)
      isVerifyCooldown.value = false
    }
  }, 1000)
}
const handleCheckStrLength = (
  str: string, maxlen: number, tipkey: string
) => {
  const strlen = str.replace(/[\u4e00-\u9fa5]/g, 'aa').length
  if (strlen > maxlen) {
    return t('cloud.message.key_is_too_long', {
      key: tipkey
    })
  }
  return ''
}
const handleResponse = (
  response: NbbResponse,
  on_success = '',
  on_error = '',
  show_errmsg = true,
) => {
  if (response.errno) {
    let errmsg = ''
    if (on_error) errmsg += on_error
    if (show_errmsg) errmsg += response.errmsg
    NAIVE_UI_MESSAGE.error(errmsg)
  } else {
    const succmsg = on_success || t('cloud.message.operate_succeed')
    NAIVE_UI_MESSAGE.success(succmsg)
  }
}
const handleSaveLoginInfo = (data: ResdataRegisterAndLogin) => {
  const newCloudConfig = resolveUserInfo(data, store.cloudConfig)
  store.setCloudConfig(newCloudConfig)
  appForceUpdate()
}

const handleSendVerify = async (email: string) => {
  if (!email) {
    NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.email'))); return
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.email_format_wrong')); return
  }
  isSendingVerify.value = true
  const verifyFunc = loginAction.value === 'resetpass' ? sendVerifyForResetPassword : sendVerify
  try {
    const response = await verifyFunc(email)
    handleResponse(response, t('cloud.message.verify_sent'))
    if (!response.errno) {
      startCooldown(60)
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.verify_send_failed', err.message))
    console.error('Send verify failed:\n', err)
  } finally {
    isSendingVerify.value = false
  }
}
const handleShowNbbAvatarSelector = () => {
  showNbbAvatarSelector.value = true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    if (loginAction.value === 'login') {
      if (!loginFormData.account) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.account'))); return
      } else if (!loginFormData.password) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.password'))); return
      }
      const response = await login(
        loginFormData.account, loginFormData.password
      )
      handleResponse(response, t('cloud.message.login_succeed'))
      if (!response.errno) {
        handleSaveLoginInfo(response.data)
        showModal.value = false
      }
    } else if (loginAction.value === 'register') {
      if (!registerFormData.email) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.email'))); return
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerFormData.email)) {
        NAIVE_UI_MESSAGE.error(t('cloud.message.email_format_wrong')); return
      } else if (!registerFormData.verifycode) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.verify_code'))); return
      } else if (!registerFormData.loginname) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.login_name'))); return
      } else if (!registerFormData.nickname) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.nickname'))); return
      } else if (!registerFormData.password) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.password'))); return
      }
      const inputLenTooLong = handleCheckStrLength(registerFormData.nickname, 12, t('common.nickname'))
      if (inputLenTooLong) {
        NAIVE_UI_MESSAGE.error(inputLenTooLong); return
      }
      const response = await register(
        registerFormData.email,
        registerFormData.nickname, registerFormData.loginname,
        registerFormData.password, registerFormData.verifycode,
      )
      handleResponse(response, t('cloud.message.register_succeed'))
      if (!response.errno) {
        handleSaveLoginInfo(response.data)
        showModal.value = false
      }
    } else if (loginAction.value === 'resetpass') {
      if (!resetpassFormData.email) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.email'))); return
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetpassFormData.email)) {
        NAIVE_UI_MESSAGE.error(t('cloud.message.email_format_wrong')); return
      } else if (!resetpassFormData.verifycode) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.verify_code'))); return
      } else if (!resetpassFormData.password) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.password'))); return
      }
      const response = await resetPassword(
        resetpassFormData.email,
        resetpassFormData.password,
        resetpassFormData.verifycode
      )
      handleResponse(response, t('cloud.message.reset_password_succeed'))
      if (!response.errno) {
        loginAction.value = 'login'
      }
    } else if (loginAction.value === 'edituser') {
      if (!edituserFormData.nickname) {
        NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('common.nickname'))); return
      }
      const inputLenTooLong = handleCheckStrLength(edituserFormData.nickname, 12, t('common.nickname')) || handleCheckStrLength(edituserFormData.title, 20, t('cloud.text.user_title'))
      if (inputLenTooLong) {
        NAIVE_UI_MESSAGE.error(inputLenTooLong); return
      }

      const newCloudConfig = deepCopy(store.cloudConfig)
      if (
        edituserFormData.nickname !== store.cloudConfig.nbb_account_nickname
        || edituserFormData.title !== store.cloudConfig.nbb_account_title
      ) {
        const response = await resetNickNameAndTitle(edituserFormData.nickname, edituserFormData.title)
        if (response.errno) {
          NAIVE_UI_MESSAGE.error(t('cloud.message.reset_nick_or_title_failed', response.errmsg)); return
        } else {
          newCloudConfig.nbb_account_nickname = edituserFormData.nickname
          newCloudConfig.nbb_account_title = edituserFormData.title
          store.setCloudConfig(newCloudConfig)
        }
      }
      if (edituserFormData.avatar !== store.cloudConfig.nbb_account_avatar) {
        const response = await resetAvatar(edituserFormData.avatar)
        if (response.errno) {
          NAIVE_UI_MESSAGE.error(t('cloud.message.reset_avatar_failed', response.errmsg)); return
        } else {
          newCloudConfig.nbb_account_avatar = edituserFormData.avatar
          store.setCloudConfig(newCloudConfig)
        }
      }

      appForceUpdate()
      showModal.value = false
    } else {
      console.error('Unexpected loginAction', loginAction.value)
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.submit_failed', err.message))
    console.error('Submit failed:\n', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    max-width="500px"
    :icon="modalIcon"
    :title="modalTitle"
    @on-load="onLoad"
  >
    <div class="wrapper">
      <div v-if="loginAction === 'login'" class="login-panel">
        <div class="form-container">
          <div class="form-label">
            <n-icon :size="15"><AccountCircleOutlined /></n-icon>
            {{ t('common.account') }}
          </div>
          <n-input
            v-model:value="loginFormData.account"
            :placeholder="t('cloud.message.please_input_loginname_or_email')"
          />
          <div class="form-label">
            <n-icon :size="15"><KeyOutlined /></n-icon>
            {{ t('common.password') }}
          </div>
          <n-input
            type="password"
            v-model:value="loginFormData.password"
            show-password-on="click"
            :placeholder="t('common.message.please_input_val', t('common.password'))"
          />
        </div>
        <div class="sub-links">
          <a href="javascript:void(0);" @click="loginAction = 'register'">{{ t('cloud.text.register_account') }}</a>
          <n-divider vertical />
          <a href="javascript:void(0);" @click="loginAction = 'resetpass'">{{ t('cloud.text.forgot_password') }}</a>
        </div>
      </div>
      <div v-else-if="loginAction === 'register'" class="register-panel">
        <div class="form-container">
          <div class="form-label">
            <n-icon :size="15"><EmailOutlined /></n-icon>
            {{ t('common.email') }}
          </div>
          <n-input
            v-model:value="registerFormData.email"
            :placeholder="t('common.message.please_input_val', t('common.email'))"
          />
          <div class="form-label">
            <n-icon :size="15"><VerifiedUserFilled /></n-icon>
            {{ t('common.verify_code') }}
          </div>
          <n-input-group>
            <n-input
              v-model:value="registerFormData.verifycode"
              :placeholder="t('common.message.please_input_val', t('common.verify_code'))"
            />
            <n-button
              type="info"
              :disabled="isVerifyCooldown || isSendingVerify"
              :loading="isSendingVerify"
              @click="handleSendVerify(registerFormData.email)"
            >
              {{ verifyButtonText }}
            </n-button>
          </n-input-group>
          <div class="form-label">
            <n-icon :size="15"><PersonOutlineOutlined /></n-icon>
            {{ t('common.login_name') }}
          </div>
          <n-input
            v-model:value="registerFormData.loginname"
            :placeholder="t('common.message.please_input_val', t('common.login_name'))"
          />
          <div class="form-label">
            <n-icon :size="15"><BadgeFilled /></n-icon>
            {{ t('common.nickname') }}
          </div>
          <n-input
            v-model:value="registerFormData.nickname"
            :placeholder="t('common.message.please_input_val', t('common.nickname'))"
            show-count clearable
          >
            <template #count="{ value }">
              <span :style="value.replace(/[\u4e00-\u9fa5]/g, 'aa').length > 12 ? 'color: var(--color-error);' : ''">
                {{ value.replace(/[\u4e00-\u9fa5]/g, 'aa').length + ' / 12' }}
              </span>
            </template>
          </n-input>
          <div class="form-label">
            <n-icon :size="15"><KeyOutlined /></n-icon>
            {{ t('common.password') }}
          </div>
          <n-input
            v-model:value="registerFormData.password"
            :placeholder="t('common.message.please_input_val', t('common.password'))"
          />
        </div>
        <div class="sub-links">
          <div>{{ t('cloud.text.do_you_have_an_account') }}</div>
          <a href="javascript:void(0);" @click="loginAction = 'login'">{{ t('cloud.text.click_here_to_login') }}</a>
        </div>
      </div>
      <div v-else-if="loginAction === 'resetpass'" class="resetpass-panel">
        <div class="form-container">
          <div class="form-label">
            <n-icon :size="15"><EmailOutlined /></n-icon>
            {{ t('common.email') }}
          </div>
          <n-input
            v-model:value="resetpassFormData.email"
            :placeholder="t('cloud.text.please_input_email_when_registered')"
          />
          <div class="form-label">
            <n-icon :size="15"><VerifiedUserFilled /></n-icon>
            {{ t('common.verify_code') }}
          </div>
          <n-input-group>
            <n-input
              v-model:value="resetpassFormData.verifycode"
              :placeholder="t('common.message.please_input_val', t('common.verify_code'))"
            />
            <n-button
              type="info"
              :disabled="isVerifyCooldown || isSendingVerify"
              :loading="isSendingVerify"
              @click="handleSendVerify(resetpassFormData.email)"
            >
              {{ verifyButtonText }}
            </n-button>
          </n-input-group>
          <div class="form-label">
            <n-icon :size="15"><KeyOutlined /></n-icon>
            {{ t('cloud.text.new_password') }}
          </div>
          <n-input
            v-model:value="resetpassFormData.password"
            :placeholder="t('cloud.text.please_input_new_password')"
          />
        </div>
        <div class="sub-links">
          <a href="javascript:void(0);" @click="loginAction = 'login'">{{ t('cloud.text.back_to_login') }}</a>
        </div>
      </div>
      <div v-else-if="loginAction === 'edituser'" class="edituser-panel">
        <div class="form-container">
          <div class="form-label">
            <n-icon :size="15"><BadgeFilled /></n-icon>
            {{ t('common.nickname') }}
          </div>
          <n-input
            v-model:value="edituserFormData.nickname"
            :placeholder="t('common.message.please_input_val', t('common.nickname'))"
            show-count clearable
          >
            <template #count="{ value }">
              <span :style="value.replace(/[\u4e00-\u9fa5]/g, 'aa').length > 12 ? 'color: var(--color-error);' : ''">
                {{ value.replace(/[\u4e00-\u9fa5]/g, 'aa').length + ' / 12' }}
              </span>
            </template>
          </n-input>
          <div class="form-label">
            <n-icon :size="15"><LabelImportantFilled /></n-icon>
            {{ t('cloud.text.user_title') }}
          </div>
          <n-input
            v-model:value="edituserFormData.title"
            :placeholder="t('common.message.please_input_val', t('cloud.text.user_title'))"
            show-count clearable
          >
            <template #count="{ value }">
              <span :style="value.replace(/[\u4e00-\u9fa5]/g, 'aa').length > 20 ? 'color: var(--color-error);' : ''">
                {{ value.replace(/[\u4e00-\u9fa5]/g, 'aa').length + ' / 20' }}
              </span>
            </template>
          </n-input>
          <div class="form-label">
            <n-icon :size="15"><FaceRetouchingNaturalFilled /></n-icon>
            {{ t('cloud.text.avatar') }}
          </div>
          <div class="avatar-edit-container">
            <n-avatar
              :size="48"
              :src="avatarUrl"
              class="button-avatar"
            />
            <n-button
              size="small"
              @click="handleShowNbbAvatarSelector"
            >
              {{ t('common.edit') }}
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button
          type="primary"
          size="large"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </template>

    <ModalNbbAvatarSelector
      v-model:show="showNbbAvatarSelector"
      v-model:avatar-id="edituserFormData.avatar"
    />
  </MyModal>
</template>

<style scoped>
.wrapper {
  .form-container {
    display: grid;
    grid-template-columns: minmax(75px, auto) 1fr;
    padding: 0 0.5em;
    gap: 4px;

    .form-label {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 15px;
    }
    .avatar-edit-container {
      margin-top: 4px;
      display: flex;
      gap: 4px;
      align-items: end;

      .button-avatar {
        display: flex;
      }
    }
  }
  .sub-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 12px;
    line-height: 1;
    margin-top: 20px;
  }
}
</style>