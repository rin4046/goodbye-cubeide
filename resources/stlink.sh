#!/bin/sh

CURRENT_DIR=$(pwd)
STLINK_ARGS=${@}

for OPT in "${@}"; do
  case "${OPT}" in
  "-cp")
    cd "${2}/../../.."
    STLINK_PATH=$(echo "$(pwd)/com.st.stm32cube.ide.mcu.externaltools.stlink-gdb-server."*"/tools/bin")
    if [ "$(uname)" == "Darwin" ]; then
      export DYLD_LIBRARY_PATH="${STLINK_PATH}/native/mac_x64:${DYLD_LIBRARY_PATH}"
    else
      export LD_LIBRARY_PATH="${STLINK_PATH}/native/linux_x64:${LD_LIBRARY_PATH}"
    fi
    break
    ;;
  esac
  shift
done

cd "${CURRENT_DIR}"
"${STLINK_PATH}/ST-LINK_gdbserver" ${STLINK_ARGS}
