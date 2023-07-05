<template>
  <q-page class="q-pa-lg">
    <q-select
      v-model="modelExchangeKey"
      :options="options"
      :option-label="getOptionValue"
      label="Exchange"
      use-input
      input-debounce="0"
      @filter="filterFn"
      style="width: 450px"
      behavior="menu"
    >
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="modelExchangeKey = ''"
          class="cursor-pointer"
        />
      </template>
      <template v-slot:hint> Field hint </template>
    </q-select>
    <div
      class="row space-between q-pt-sm"
      v-for="field in fields"
      :key="field.label"
    >
      <div class="self-center">
        <q-btn
          flat
          round
          color="primary"
          icon="content_paste"
          @click="pasteFromClipboard(field.label)"
        />
      </div>
      <q-input
        outlined
        class="col"
        :label="field.label"
        v-model="field.value"
        @update:model-value="updateQrCode"
      >
        <template v-slot:append>
          <q-icon
            name="close"
            @click="field.value = ''"
            class="cursor-pointer"
          />
        </template>
      </q-input>
    </div>
    <div class="qr-code q-mt-lg flex justify-center">
      <canvas v-show="showQrCode" id="qr-code"></canvas>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { EXCHANGES_META } from 'src/components/exchangeMeta';
import { generateQr } from 'src/components/qrGenerator';

const options = ref(Object.keys(EXCHANGES_META));
const modelExchangeKey = ref(options.value[0]);

const FIELD_PLACEHOLDER: { [index: string]: string } = {
  apiKeyNeeded: 'API Key*',
  secretKeyNeeded: 'API Secret*',
  clientIdNeeded: 'Client/User id*',
  walletIdNeeded: 'Wallet id*',
  passphraseNeeded: 'Passphrase*',
  subAccountNeeded: 'Subaccount*',
};

const getExchangeFields = (key: string) => {
  if (key === '') {
    return [];
  }
  const exchangeMeta = EXCHANGES_META[key];
  return Object.keys(exchangeMeta)
    .map((key) => ({
      key,
      label: FIELD_PLACEHOLDER[key],
      value: '',
    }))
    .filter((v) => v.label !== undefined);
};

const fields = ref(getExchangeFields('BINANCE'));
watch(modelExchangeKey, (value: string) => {
  fields.value = getExchangeFields(value);
  showQrCode.value = false;
});

const pasteFromClipboard = (label: string) => {
  navigator.clipboard.readText().then((value: string) => {
    const field = fields.value.find((f) => f.label === label);
    if (field === undefined) return;
    field.value = value.trim();
    updateQrCode();
  });
};

const filterFn = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      options.value = Object.keys(EXCHANGES_META);
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    options.value = Object.keys(EXCHANGES_META).filter(
      (v) => v.toLowerCase().indexOf(needle) > -1
    );
  });
};

const getOptionValue = (key: string) => {
  return EXCHANGES_META[key]?.name ? EXCHANGES_META[key]?.name : key;
};

const FIELD_ORDER: Record<string, number> = {
  exchangeKey: 0,
  apiKeyNeeded: 1,
  secretKeyNeeded: 2,
  clientIdNeeded: 3,
  walletIdNeeded: 4,
  subAccountNeeded: 5,
  passphraseNeeded: 6,
};

const showQrCode = ref(false);

function getFieldsData(): string {
  let resultData: string[] = new Array(7);
  resultData[FIELD_ORDER['exchangeKey']] = modelExchangeKey.value;
  fields.value.forEach((field) => {
    resultData[FIELD_ORDER[field.key]] = field.value;
  });
  showQrCode.value = fields.value.every((field) => field.value !== '');

  return resultData.join('|');
}

const updateQrCode = () => {
  const cells = generateQr(getFieldsData());
  const canvas: HTMLCanvasElement | null = document.getElementById(
    'qr-code'
  ) as HTMLCanvasElement;

  if (canvas === null || cells === undefined) return;
  const ctx = canvas.getContext('2d');
  const numCells = cells.length;

  const devicePixelRatio = window.devicePixelRatio || 1;
  const size = 200;

  const scale = (size / numCells) * devicePixelRatio;
  canvas.height = canvas.width = size * devicePixelRatio;

  if (ctx === null) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, numCells, numCells);
  ctx.fillStyle = '#000';

  cells.forEach(function (row: boolean[], rdx: number) {
    row.forEach(function (cell, cdx) {
      if (cell) {
        ctx.fillRect(cdx, rdx, 1, 1);
      }
    });
  });
};
</script>
