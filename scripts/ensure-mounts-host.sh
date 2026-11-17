#!/usr/bin/env bash
# ==============================================================================
# AGENCIA NACIONAL DE INFRAESTRUCTURA (ANI)
# Script de Verificación y Montaje en Servidor Web Dokploy (10.88.199.214)
# Conecta con el Servidor Local de Servicios Propios sv-ani (10.88.199.195)
# ==============================================================================
set -e

LINUX_SERVER_IP="${LINUX_SERVER_IP:-10.88.199.195}"
NFS_EXPORT="${NFS_EXPORT:-${LINUX_SERVER_IP}:/ani}"
NFS_MOUNT_POINT="${NFS_MOUNT_POINT:-/mnt/ani}"
SAMBA_SHARE="${SAMBA_SHARE:-//${LINUX_SERVER_IP}/compartido}"
SAMBA_MOUNT_POINT="${SAMBA_MOUNT_POINT:-/mnt/samba}"
SAMBA_USER="${SAMBA_USER:-ubuntu}"
SAMBA_PASS="${SAMBA_PASS:-123}"

echo "=================================================================="
echo " Verificando montajes de red en Host Web (10.88.199.214)"
echo " Servidor destino sv-ani: ${LINUX_SERVER_IP}"
echo "=================================================================="

# 1. Crear puntos de montaje locales si no existen
sudo mkdir -p "${NFS_MOUNT_POINT}" "${SAMBA_MOUNT_POINT}"

# 2. Verificar y montar NFSv4 (/mnt/ani)
if mountpoint -q "${NFS_MOUNT_POINT}"; then
  echo "[OK] NFS ya se encuentra montado en ${NFS_MOUNT_POINT}"
else
  echo "[INFO] Montando recurso NFS ${NFS_EXPORT} en ${NFS_MOUNT_POINT}..."
  sudo mount -t nfs4 "${NFS_EXPORT}" "${NFS_MOUNT_POINT}" || sudo mount -t nfs "${NFS_EXPORT}" "${NFS_MOUNT_POINT}"
  echo "[OK] NFS montado exitosamente en ${NFS_MOUNT_POINT}"
fi

# 3. Verificar y montar Samba CIFS (/mnt/samba)
if mountpoint -q "${SAMBA_MOUNT_POINT}"; then
  echo "[OK] Samba ya se encuentra montado en ${SAMBA_MOUNT_POINT}"
else
  echo "[INFO] Montando recurso Samba ${SAMBA_SHARE} en ${SAMBA_MOUNT_POINT}..."
  if [ -f /etc/samba/credentials-web ]; then
    sudo mount -t cifs "${SAMBA_SHARE}" "${SAMBA_MOUNT_POINT}" -o credentials=/etc/samba/credentials-web,rw,file_mode=0777,dir_mode=0777
  else
    sudo mount -t cifs "${SAMBA_SHARE}" "${SAMBA_MOUNT_POINT}" -o username="${SAMBA_USER}",password="${SAMBA_PASS}",rw,file_mode=0777,dir_mode=0777
  fi
  echo "[OK] Samba montado exitosamente en ${SAMBA_MOUNT_POINT}"
fi

echo "=================================================================="
echo " Estado actual de puntos de montaje para Dokploy:"
df -h "${NFS_MOUNT_POINT}" "${SAMBA_MOUNT_POINT}" || true
echo "=================================================================="
